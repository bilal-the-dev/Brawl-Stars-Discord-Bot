const Users = require("../models/Users");
const { getBrawtStarsUserInfoByTag } = require("./api");
const config = require("./../../config.json");
const { EmbedBuilder } = require("discord.js");

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
    response: { Stats, Name },
  } = data;

  const query = {
    brawlStarsTag,
    $or: [{ private: false }, { private: undefined }],
  };

  if (isPrivate) {
    delete query["$or"];
    query.private = true;
  }

  await Users.findOneAndUpdate(
    query,
    {
      username: name,
      superCellId,
      private: isPrivate,
      brawlStarsTag,
      brawlStarsUsername: Name,
      trophies: Stats["3"],
      credits: Stats["20"],
    },
    { upsert: true }
  );
  await interaction.editReply({
    content: "Success! your data has been saved!",
  });
};

exports.refreshBrawlStarsInfo = async (interaction) => {
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

  let failedUsers = [];

  let successfulUserCount = 0;

  for (const user of users) {
    try {
      const data = await getBrawtStarsUserInfoByTag(user.brawlStarsTag);

      const {
        response: { Stats, Name },
      } = data;

      await user.updateOne({
        trophies: Stats["3"],
        brawlStarsUsername: Name,
        credits: Stats["20"],
      });

      successfulUserCount++;

      await new Promise((res) =>
        setTimeout(() => {
          res();
        }, 1000 * 10)
      );
    } catch (error) {
      console.log(error);

      if (user.userId) failedUsers.push("<@" + user.userId + ">");
      else failedUsers.push(user.username);
    }
  }

  if (interaction)
    await interaction.channel.send(
      `Refreshed data for ${successfulUserCount} users , failed users: ${
        failedUsers.join(", ") || "None"
      }`
    );
};

exports.generateLeaderboardData = async (guild, interaction, isPrivate) => {
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
    let userDecidedFame = {};
    let rankDisplay;

    if (index === 0) rankDisplay = "🥇";
    else if (index === 1) rankDisplay = "🥈";
    else if (index === 2) rankDisplay = "🥉";
    else rankDisplay = `#${index + 1}`;

    const { credits, brawlStarsTag, markType } = user;

    for (const fame of config) {
      if (credits > fame.creditsRequired) userDecidedFame = fame;
    }

    if (lastFame && lastFame !== userDecidedFame.fameName) {
      description +=
        "--------------------------------------------------------------------------\n";
    }

    let isPrivateMemberInServer = "❌";

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

    description += `**${rankDisplay} - ${
      user.member ? user.member.displayName : user.username
    }** ${isPrivate ? isPrivateMemberInServer : ""} ${user.superCellId ? `(${user.superCellId})` : ""}(#${brawlStarsTag}) (${
      userDecidedFame.shortName
    } ${userDecidedFame.emoji}) ${credits}\n`;

    lastFame = userDecidedFame.fameName;

    // make dynamic embeds to avoid 4096 max desc length
    if (description.length >= 3900) {
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
