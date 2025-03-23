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
      const isPrivate = options.getString("private");

      const query = {
        brawlStarsTag,
        $or: [{ private: false }, { private: undefined }],
      };

      if (isPrivate === "true") {
        delete query["$or"];
        query.private = true;
      }

      const r = await Users.findOneAndDelete(query, {});

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
      name: "private",
      description: "whether private data or not",
      type: 3,
      required: true,
      choices: [
        { name: "true", value: "true" },
        { name: "false", value: "false" },
      ],
    },
  ],
};
