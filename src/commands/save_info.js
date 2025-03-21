const { CommandType } = require("wokcommands");

const { handleInteractionError } = require("../utils/interaction");
const { saveBrawlInfo } = require("../utils/functions");

module.exports = {
  description: "Save your profile info for brawl stars!",
  async callback({ interaction }) {
    try {
      await saveBrawlInfo(interaction, false);
    } catch (error) {
      handleInteractionError(interaction, error);
    }
  },

  guildOnly: true,
  type: CommandType.SLASH,
  options: [
    {
      type: 3,
      name: "name",
      description: "name of user",
      required: true,
    },
    {
      type: 3,
      name: "supercell_id",
      description: "supercell_id of user",
      required: true,
    },
    {
      type: 3,
      name: "tag",
      description: "your brawl stars tag",
      required: true,
    },
  ],
};
