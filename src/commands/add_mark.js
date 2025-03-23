const { CommandType } = require("wokcommands");

const { handleInteractionError } = require("../utils/interaction");
const Users = require("../models/Users");

module.exports = {
  description: "Remove someone!",
  async callback({ interaction }) {
    try {
      await interaction.deferReply();

      const { options } = interaction;
      const brawlStarsTag = options.getString("tag").replace("#", "");
      const type = options.getString("type");

      const query = {
        brawlStarsTag,
        private: true,
      };

      const r = await Users.findOneAndUpdate(query, { markType: type });

      if (!r) throw new Error("Could not find anyone matching that tag!");

      await interaction.editReply("Success!");
    } catch (error) {
      handleInteractionError(interaction, error);
    }
  },

  guildOnly: true,
  type: CommandType.SLASH,
  options: [
    {
      type: 3,
      name: "tag",
      description: "brawl stars tag",
      required: true,
    },
    {
      name: "type",
      description: "type of mark",
      type: 3,
      required: true,
      choices: [
        { name: "✅", value: "tick" },
        { name: "❌", value: "cross" },
      ],
    },
  ],
};
