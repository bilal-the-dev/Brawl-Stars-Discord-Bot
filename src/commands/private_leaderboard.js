const { CommandType } = require("wokcommands");

const { handleInteractionError } = require("../utils/interaction");
const Users = require("../models/Users");
const { getBrawtStarsUserInfoByTag } = require("../utils/api");
const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  description: "Save your profile info for brawl stars!",
  async callback({ interaction }) {
    try {
      await interaction.deferReply();
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await interaction.editReply({
          content: "🚫 You do not have permission to use this command. (Admin only)",
          ephemeral: true,
        });
      }
      const brawlStarsTag = interaction.options
        .getString("tag")
        .replace("#", "");

        const useridTag = interaction.options
        .getString("user_id");
        let fetchedUser;
        try {
            fetchedUser = await interaction.client.users.fetch(useridTag);
          } catch (err) {
            return await interaction.editReply(`❌ The provided user ID **${useridTag}** is invalid.`);
          }

          const { username } = fetchedUser;
      console.log(brawlStarsTag);

      const tagExists = await Users.findOne({ brawlStarsTag  });

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
        { userId : useridTag },
        {
          userId : useridTag,
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
        name: "user_id",
        description: "Add a user Id",
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
