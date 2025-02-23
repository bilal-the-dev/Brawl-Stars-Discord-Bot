const { PermissionFlagsBits } = require("discord.js");
const { CommandType } = require("wokcommands");

const { handleInteractionError } = require("../utils/interaction");
const { generateLeaderboardData } = require("../utils/functions");

module.exports = {
  description: "View leaderboards for private users!",
  async callback({ interaction }) {
    try {
      await generateLeaderboardData(interaction.guild, interaction, true);
    } catch (error) {
      handleInteractionError(interaction, error);
    }
  },

  guildOnly: true,
  type: CommandType.SLASH,
  permissions: [PermissionFlagsBits.Administrator],
};
