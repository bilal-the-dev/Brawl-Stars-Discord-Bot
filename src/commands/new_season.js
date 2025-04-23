const { CommandType } = require("wokcommands");

const { handleInteractionError } = require("../utils/interaction");
const { refreshBrawlStarsInfo } = require("../utils/functions");
const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  description: "Refresh user data for new season",
  async callback({ interaction }) {
    try {
      await refreshBrawlStarsInfo({ interaction, refreshType: "brawlPass" });
    } catch (error) {
      handleInteractionError(interaction, error);
    }
  },

  guildOnly: true,
  type: CommandType.SLASH,
  permissions: [PermissionFlagsBits.Administrator],
};
