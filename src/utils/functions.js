const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const Users = require("../models/Users");
const { getBrawtStarsUserInfoByTag } = require("./api");
const config = require("./../../config.json");

exports.saveBrawlInfo = async (interaction, isPrivate) => {
  await interaction.deferReply();

  const { options } = interaction;

  const brawlStarsTag = options.getString("tag").replace("#", "");
  const name = options.getString("name");
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
    response: { Stats, Name, Alliance },
  } = data;

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
      username: name,
      superCellId,
      private: isPrivate,
      brawlStarsTag,
      brawlStarsUsername: Name,
      trophies: Stats["3"],
      credits: Stats["20"],
      allianceLocation: Alliance?.RegionName,
    },
    { upsert: true, new: true }
  );

  if (!oldDoc) {
    console.log("New user created with credits:", Stats["20"]);

    await userDoc.updateOne({
      oldCredits: Stats["20"],
      newRefreshedCredits: Stats["20"],
    });
  }
  await interaction.editReply({
    content: "Success! your data has been saved!",
  });
};

exports.refreshBrawlStarsInfo = async ({ interaction, dailyRefresh } = {}) => {
  if (interaction)
    await interaction.reply(
      "Refreshing... Will send a message when completed! Takes 10 seconds approx for each user."
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

  const result = await refreshUsersBatch(users, dailyRefresh);

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
      time: 1000 * 60 * 3,
    });

    collector.on("collect", async (i) => {
      await i.update({ components: [] });

      const retryResult = await refreshUsersBatch(
        result.failedUsers,
        dailyRefresh
      );

      await i.channel.send({
        content: `Retried ${retryResult.failedUsers.length} users.\nSuccess: ${retryResult.successfulCount}, Failed: ${
          retryResult.failedUsers.join(", ") || "None"
        }`,
      });
    });
  }
};

exports.generateLeaderboardData = async (
  guild,
  interaction,
  isPrivate,
  newCredits
) => {
  if (interaction) await interaction.deferReply();

  let secondIsPrivate = isPrivate;

  if (!isPrivate) secondIsPrivate = undefined;

  const users = await Users.find({
    $or: [{ private: isPrivate }, { private: secondIsPrivate }],
  })
    .sort({ credits: "descending" })
    .lean();

  if (users.length === 0)
    throw new Error("No user found in database, start saving your info.");

  const content = "Here are the top players sorted by credits!\n\n";

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
      newCredits,
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
    await interaction.editReply({ content, embeds: [embeds[0]] });

    if (embeds.length >= 1) {
      for (const embed of embeds.slice(1)) {
        await interaction.channel.send({ embeds: [embed] });
      }
    }
  }

  return embeds;
};

exports.parseUserInfoToStr = async ({
  user,
  description,
  postion,
  lastFame,
  isPrivate,
  newCredits,
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

  if (newCredits) {
    const diff = user.newRefreshedCredits - user.oldCredits;

    creditsChange = `${diff >= 0 ? "📈" : "📉"} ${Math.abs(diff)} <:Credits:1355573284149661866>`;
  }

  if (!newCredits) {
    description += `**${rankDisplay} - ${
      user.member ? user.member.displayName : user.username
    }** ${isPrivate ? isPrivateMemberInServer : ""}${flagEmoji ?? ""} ${user.superCellId ? `(${user.superCellId})` : ""}(#${brawlStarsTag}) (${
      userDecidedFame.shortName
    } ${userDecidedFame.emoji}) ${credits} <:Credits:1355573284149661866>\n`;
  }

  if (newCredits) {
    description += `**${rankDisplay} - ${
      user.member ? user.member.displayName : user.username
    }** ${creditsChange}\n`;
  }

  return {
    userDescription: description,
    newLastFame: userDecidedFame.fameName,
  };
};

async function refreshUsersBatch(users, dailyRefresh = false) {
  let failedUsers = [];
  let failedUserNames = [];
  let successfulCount = 0;

  for (const user of users) {
    try {
      const data = await getBrawtStarsUserInfoByTag(user.brawlStarsTag);
      const {
        response: { Stats, Name, Alliance },
      } = data;

      await user.updateOne({
        trophies: Stats["3"],
        brawlStarsUsername: Name,
        credits: Stats["20"],
        ...(dailyRefresh && { oldCredits: user.newRefreshedCredits }),
        ...(dailyRefresh && { newRefreshedCredits: Stats["20"] }),
        allianceLocation: Alliance?.RegionName,
      });

      successfulCount++;

      await new Promise((res) => setTimeout(res, 1000 * 10));
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
