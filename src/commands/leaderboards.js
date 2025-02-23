const { CommandType } = require("wokcommands");

const { handleInteractionError } = require("../utils/interaction");
const { generateLeaderboardData } = require("../utils/functions");

module.exports = {
  description: "View leaderboards for all users!",
  async callback({ interaction }) {
    try {
      await generateLeaderboardData(interaction.guild, interaction, false);
    } catch (error) {
      handleInteractionError(interaction, error);
    }
  },

  guildOnly: true,
  type: CommandType.SLASH,
};
