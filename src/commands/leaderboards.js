const { EmbedBuilder } = require("discord.js");
const { CommandType } = require("wokcommands");

const config = require("./../../config.json");
const { handleInteractionError } = require("../utils/interaction");
const Users = require("../models/Users");

module.exports = {
  description: "View leaderboards for all users!",
  async callback({ interaction }) {
    try {
      await interaction.deferReply();

      const users = await Users.find({}).sort({ credits: "descending" }).lean()

      if (users.length === 0)
        throw new Error(
          "No user found in database, start saving your info via /save_info"
        );

      let description = "Here are the top players sorted by credits!\n\n";

      let lastFame = null;

      for(const user of users){
        user.member = await interaction.guild.members.fetch(user).catch(console.error)
      }

      users.forEach((user, index) => {
        let userDecidedFame = {};
        let rankDisplay;

        if (index === 0) rankDisplay = "🥇";
        else if (index === 1) rankDisplay = "🥈";
        else if (index === 2) rankDisplay = "🥉";
        else rankDisplay = `#${index + 1}`;

        const { credits, userId, brawlStarsTag } = user;

        for (const fame of config) {
          if (credits > fame.creditsRequired) userDecidedFame = fame;
        }

        if (lastFame && lastFame !== userDecidedFame.fameName) {
          description +=
            "--------------------------------------------------------------------------\n";
        }

        description += `**${rankDisplay} - ${user.member ? user.member.displayName :  '<@'+ userId +'>'}** (#${brawlStarsTag}) (${userDecidedFame.shortName} ${userDecidedFame.emoji}) ${credits}\n`;

        lastFame = userDecidedFame.fameName;
      });

      const embed = new EmbedBuilder()
        .setTitle("🏆 Brawl Stars Leaderboard")
        .setColor("#FFD700")
        .setDescription(description)
        .setThumbnail(
          "https://static.vecteezy.com/system/resources/previews/027/127/543/non_2x/brawl-stars-logo-brawl-stars-icon-transparent-free-png.png"
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      handleInteractionError(interaction, error);
    }
  },

  guildOnly: true,
  type: CommandType.SLASH,
};
