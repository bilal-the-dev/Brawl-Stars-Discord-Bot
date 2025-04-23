const { CommandType } = require("wokcommands");

const { handleInteractionError } = require("../utils/interaction");
const { generateLeaderboardData } = require("../utils/functions");

module.exports = {
  description: "View new credits for all users!",
  async callback({ interaction }) {
    try {
      const isPrivate = false;
      await generateLeaderboardData(
        interaction.guild,
        interaction,
        isPrivate,
        interaction.options.getString("type") // new credits type
      );
    } catch (error) {
      handleInteractionError(interaction, error);
    }
  },

  guildOnly: true,
  type: CommandType.SLASH,
  options: [
    {
      name: "type",
      description: "tpye of new credits",
      type: 3,
      required: true,
      choices: [
        { name: "Daily", value: "daily" },
        { name: "Weekly", value: "weekly" },
        { name: "Monthly", value: "monthly" },
        { name: "Brawl Season", value: "brawlPass" },
      ],
    },
  ],
};
