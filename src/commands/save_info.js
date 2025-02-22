const { CommandType } = require("wokcommands");

const { handleInteractionError } = require("../utils/interaction");
const Users = require("../models/Users");
const { getBrawtStarsUserInfoByTag } = require("../utils/api");
const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  description: "Save your profile info for brawl stars!",
  async callback({ interaction }) {
    try {
      const {
        user: { id: userId , username },
      } = interaction;

      await interaction.deferReply();

      
      const brawlStarsTag = interaction.options
        .getString("tag")
        .replace("#", "");

      console.log(brawlStarsTag);

      const tagExists = await Users.findOne({ brawlStarsTag });

      if (tagExists)
        return await interaction.editReply(
          `User <@${tagExists.userId}> has already claimed the tag 😔`
        );

      const data = await getBrawtStarsUserInfoByTag(brawlStarsTag);

      const {
        response: { Stats },
        Name,
      } = data;

      await Users.findOneAndUpdate(
        { userId },
        {
          userId,
          username,
          brawlStarsTag,
          brawlStarsUsername: Name,
          trophies: Stats["3"],
          credits: Stats["20"],
        },
        { upsert: true }
      );

      await interaction.editReply({
        content:
          "Success! your data has been saved and can be viewed via /leaderboards",
      });
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
      description: "your brawl stars tag",
      required: true,
    },
  ],
};
