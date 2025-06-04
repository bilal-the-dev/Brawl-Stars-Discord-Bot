const { CommandType } = require("wokcommands");

const { handleInteractionError } = require("../utils/interaction");
const { generateLeaderboardData } = require("../utils/functions");
const { ApplicationCommandOptionType } = require("discord.js");
const { flagEmojiToCountryCode } = require("../utils/parse");

module.exports = {
  description: "Search on leaderbaord via flag",
  async callback({ interaction }) {
    try {
      const flag = flagEmojiToCountryCode(
        interaction.options.getString("flag")
      );

      await generateLeaderboardData(
        interaction.guild,
        interaction,
        interaction.options.getBoolean("private"),
        null, // new credits stuff,
        flag
      );
    } catch (error) {
      handleInteractionError(interaction, error);
    }
  },

  guildOnly: true,
  type: CommandType.SLASH,
  options: [
    {
      name: "private",
      description: "whether search in private data or not",
      type: ApplicationCommandOptionType.Boolean,
      required: true,
    },

    {
      name: "flag",
      description: "flag want to filter based on",
      type: 3,
      required: true,
    },
  ],
};
