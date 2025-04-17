const { CommandType } = require("wokcommands");

const { handleInteractionError } = require("../utils/interaction");
const Users = require("../models/Users");
const { parseUserInfoToStr } = require("../utils/functions");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  description: "Search with tag!",
  async callback({ interaction }) {
    try {
      await interaction.deferReply();

      const { options } = interaction;
      const brawlStarsTag = options.getString("tag").replace("#", "");

      const query = {
        $or: [{ private: false }, { private: undefined }],
      };

      const docs = await Users.find(query)
        .sort({ credits: "descending" })
        .lean();

      if (docs.length === 0) throw new Error("No data found in database!");

      const userPos = docs.findIndex((d) => d.brawlStarsTag === brawlStarsTag);

      if (userPos === -1) throw new Error("Could not find you in database!");

      const user = docs[userPos];

      if (user.userId)
        // they dont have user id for private so this "if" will never happen
        user.member = await interaction.guild.members
          .fetch(user.userId)
          .catch(console.error);

      const { userDescription } = await parseUserInfoToStr({
        user,
        postion: userPos + 1,
        description: "",
      });

      const embed = new EmbedBuilder()
        .setTitle("🏆 Brawl Stars Info")
        .setColor("#FFD700")
        .setDescription(userDescription)
        .setThumbnail(
          "https://static.vecteezy.com/system/resources/previews/027/127/543/non_2x/brawl-stars-logo-brawl-stars-icon-transparent-free-png.png"
        );

      await interaction.editReply({ embeds: [embed] });
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
  ],
};
