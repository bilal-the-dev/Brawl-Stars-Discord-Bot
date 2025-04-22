const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const Users = require("../models/Users");
const { getBrawtStarsUserInfoByTag } = require("./api");
const config = require("./../../config.json");
const {
  pagination,
  ButtonTypes,
  ButtonStyles,
} = require("@devraelfreeze/discordjs-pagination");

exports.saveBrawlInfo = async (interaction, isPrivate) => {
  await interaction.deferReply();

  const { options } = interaction;

  const brawlStarsTag = options.getString("tag").replace("#", "");
  const userInputName = options.getString("name");
  const superCellId = options.getString("supercell_id");

  // since public info is similar to private now, i think no need to validate anymore?
  // if (!isPrivate) {
  //   const tagExists = await Users.findOne({ brawlStarsTag, private: false });

  //   if (tagExists)
  //     return await interaction.editReply(
  //       `User <@${tagExists.userId}> has already claimed the tag 😔`
  //     );
  // }

  const data = await getBrawtStarsUserInfoByTag(brawlStarsTag);

  const {
    result: { stats, name, alliance },
  } = data;

  const credits = stats.find((s) => s.stat_id === 20).value;

  const query = {
    brawlStarsTag,
    $or: [{ private: false }, { private: undefined }],
  };

  if (isPrivate) {
    delete query["$or"];
    query.private = true;
  }

  const oldDoc = await Users.findOne(query);

  const userDoc = await Users.findOneAndUpdate(
    query,
    {
      username: userInputName,
      superCellId,
      private: isPrivate,
      brawlStarsTag,
      brawlStarsUsername: name,
      credits,
      allianceLocation: alliance?.region,
    },
    { upsert: true, new: true }
  );

  if (!oldDoc) {
    console.log("New user created with credits:", credits);

    await userDoc.updateOne({
      dailyOldCredits: credits,
      weeklyOldCredits: credits,
      monthlyOldCredits: credits,
      dailyRefreshedCredits: credits,
      weeklyRefreshedCredits: credits,
      monthlyRefreshedCredits: credits,
    });
  }
  await interaction.editReply({
    content: "Success! your data has been saved!",
  });
};

exports.refreshBrawlStarsInfo = async ({ interaction, refreshType } = {}) => {
  if (interaction)
    await interaction.reply(
      "Refreshing... Will send a message when completed!"
    );

  let isPrivate, secondIsPrivate;

  if (interaction)
    secondIsPrivate = isPrivate =
      interaction.options.getString("private") == "true";

  console.log(secondIsPrivate);
  console.log(isPrivate);

  if (!isPrivate) {
    isPrivate = false;
    secondIsPrivate = undefined;
  }

  const users = await Users.find({
    $or: [{ private: isPrivate }, { private: secondIsPrivate }],
  });

  if (users.length === 0)
    throw new Error("No user found in database, start saving your info.");

  const result = await refreshUsersBatch(users, refreshType);

  if (interaction) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("refresh_failed")
        .setLabel(`Refresh Failed Users (${result.failedUsers.length})`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(result.failedUsers.length === 0)
    );

    const m = await interaction.channel.send({
      content: `Refreshed data for ${result.successfulCount} users, failed users: ${
        result.failedUserNames.join(", ") || "None"
      }`,
      components: [row],
    });

    const collector = m.createMessageComponentCollector({
      filter: (i) =>
        i.customId === "refresh_failed" && i.user.id === interaction.user.id,
      time: 1000 * 60 * 60,
    });

    collector.on("collect", async (i) => {
      await i.update({ components: [] });

      const retryResult = await refreshUsersBatch(result.failedUsers); // in interaction, we will never have daily/ weekly/monthly refresh

      await i.channel.send({
        content: `Retried ${retryResult.failedUsers.length} users.\nSuccess: ${retryResult.successfulCount}, Failed: ${
          retryResult.failedUserNames.join(", ") || "None"
        }`,
      });
    });
  }
};

exports.generateLeaderboardData = async (
  guild,
  interaction,
  isPrivate,
  newCreditsType
) => {
  if (interaction)
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  let secondIsPrivate = isPrivate;

  if (!isPrivate) secondIsPrivate = undefined;

  const users = await Users.find({
    $or: [{ private: isPrivate }, { private: secondIsPrivate }],
  })
    .sort({ credits: "descending" })
    .lean();

  if (users.length === 0)
    throw new Error("No user found in database, start saving your info.");

  let description = "";
  const embeds = [];

  let lastFame = null;

  for (const user of users) {
    if (user.userId)
      // they dont have user id for private so this "if" will never happen
      user.member = await guild.members.fetch(user.userId).catch(console.error);
  }

  for (const [index, user] of users.entries()) {
    const { userDescription, newLastFame } = await this.parseUserInfoToStr({
      user,
      postion: index + 1,
      description,
      isPrivate,
      lastFame,
      newCreditsType,
    });

    lastFame = newLastFame;

    description = userDescription;

    // make dynamic embeds to avoid 4096 max desc length
    if (
      description.length >= (isPrivate ? 2000 : 3500) ||
      index === users.length - 1
    ) {
      const embed = new EmbedBuilder()
        .setTitle("🏆 Brawl Stars Leaderboard")
        .setColor("#FFD700")
        .setDescription(description)
        .setThumbnail(
          "https://static.vecteezy.com/system/resources/previews/027/127/543/non_2x/brawl-stars-logo-brawl-stars-icon-transparent-free-png.png"
        );

      embeds.push(embed);
      description = "";
    }
  }

  if (interaction) {
    await pagination({
      embeds /** Array of embeds objects */,
      author: interaction.user,
      interaction: interaction,
      ephemeral: true,
      time: 1000 * 60 * 5 /** 40 seconds */,
      disableButtons: true /** Remove buttons after timeout */,
      fastSkip: false,
      pageTravel: false,
      buttons: [
        {
          type: ButtonTypes.previous,
          label: "Previous",
          style: ButtonStyles.Danger,
        },
        {
          type: ButtonTypes.next,
          label: "Next",
          style: ButtonStyles.Success,
        },
      ],
    });
  }

  return embeds;
};

exports.parseUserInfoToStr = async ({
  user,
  description,
  postion,
  lastFame,
  isPrivate,
  newCreditsType,
}) => {
  let userDecidedFame = {};
  let rankDisplay;

  if (postion === 1) rankDisplay = "🥇";
  else if (postion === 2) rankDisplay = "🥈";
  else if (postion === 3) rankDisplay = "🥉";
  else rankDisplay = `#${postion}`;

  const { credits, brawlStarsTag, markType, flag } = user;

  for (const fame of config) {
    if (credits > fame.creditsRequired) userDecidedFame = fame;
  }

  if (lastFame && lastFame !== userDecidedFame.fameName) {
    description +=
      "--------------------------------------------------------------------------\n";
  }

  let isPrivateMemberInServer = "❌";

  let flagEmoji = user.allianceLocation
    ? `:flag_${user.allianceLocation.toLowerCase()}:`
    : "";

  if (flag) flagEmoji = flag;

  if (isPrivate) {
    if (!markType) {
      const d = await Users.findOne({
        brawlStarsTag,
        $or: [{ private: false }, { private: undefined }],
      });

      if (d) isPrivateMemberInServer = "✅";
    }

    if (markType) {
      isPrivateMemberInServer = markType === "tick" ? "✅" : "❌";
    }
  }

  let creditsChange;

  if (newCreditsType) {
    const diff =
      user[`${newCreditsType}RefreshedCredits`] -
      user[`${newCreditsType}OldCredits`];

    let changeEmoji;

    if (diff === 0) changeEmoji = "➖";
    if (diff > 0) changeEmoji = "📈";
    if (diff < 0) changeEmoji = "📉";
    creditsChange = `${changeEmoji} ${Math.abs(diff)} <:Credits:1355573284149661866>`;
  }

  if (!newCreditsType) {
    description += `**${rankDisplay} - ${
      user.member ? user.member.displayName : user.username
    }** ${isPrivate ? isPrivateMemberInServer : ""}${flagEmoji ?? ""} ${user.superCellId ? `(${user.superCellId})` : ""}(#${brawlStarsTag}) (${
      userDecidedFame.shortName
    } ${userDecidedFame.emoji}) ${credits} <:Credits:1355573284149661866>\n`;
  }

  if (newCreditsType) {
    description += `**${rankDisplay} - ${
      user.member ? user.member.displayName : user.username
    }** ${creditsChange}\n`;
  }

  return {
    userDescription: description,
    newLastFame: userDecidedFame.fameName,
  };
};

async function refreshUsersBatch(users, refreshType) {
  let failedUsers = [];
  let failedUserNames = [];
  let successfulCount = 0;

  for (const user of users) {
    try {
      const data = await getBrawtStarsUserInfoByTag(user.brawlStarsTag);
      const {
        result: { stats, name, alliance },
      } = data;

      const credits = stats.find((s) => s.stat_id === 20).value;

      await user.updateOne({
        brawlStarsUsername: name,
        credits: credits,
        ...(refreshType && {
          [`${refreshType}OldCredits`]: user[`${refreshType}RefreshedCredits`],
        }),
        ...(refreshType && { [`${refreshType}RefreshedCredits`]: credits }),
        allianceLocation: alliance?.region,
      });

      successfulCount++;

      // await new Promise((res) => setTimeout(res, 1000 * 10)); // no need anymore with new api
    } catch (error) {
      console.log(error);
      failedUsers.push(user);
      failedUserNames.push(user.userId ? `<@${user.userId}>` : user.username);
    }
  }

  return {
    successfulCount,
    failedUsers,
    failedUserNames,
  };
}
