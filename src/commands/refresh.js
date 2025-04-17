const { CommandType } = require("wokcommands");

const { handleInteractionError } = require("../utils/interaction");
const { refreshBrawlStarsInfo } = require("../utils/functions");

module.exports = {
  description: "Refresh all user data",
  async callback({ interaction }) {
    try {
      await refreshBrawlStarsInfo({ interaction });
    } catch (error) {
      handleInteractionError(interaction, error);
    }
  },

  guildOnly: true,
  type: CommandType.SLASH,
  options: [
    {
      name: "private",
      description: "whether refresh private data or not",
      type: 3,
      required: true,
      choices: [
        { name: "true", value: "true" },
        { name: "false", value: "false" },
      ],
    },
  ],
};
