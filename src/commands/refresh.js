const { CommandType } = require("wokcommands");

const { handleInteractionError } = require("../utils/interaction");
const Users = require("../models/Users");
const { PermissionFlagsBits } = require("discord.js");
const { getBrawtStarsUserInfoByTag } = require("../utils/api");

module.exports = {
  description: "Refresh all user data",
  async callback({ interaction }) {
    try {
      await interaction.reply(
        "Refreshing... Will send a message when completed! Takes 10 seconds approx for each user."
      );

      const users = await Users.find({});

      if (users.length === 0)
        throw new Error(
          "No user found in database, start saving your info via /save_info"
        );

      let failedUsers = [];

      let successfulUserCount = 0;

      for (const user of users) {
        try {
          const data = await getBrawtStarsUserInfoByTag(user.brawlStarsTag);

          const {
            response: { Stats },
          } = data;

          await user.updateOne({
            trophies: Stats["3"],
            credits: Stats["20"],
          });

          successfulUserCount++;

          await new Promise((res) =>
            setTimeout(() => {
              res();
            }, 1000 * 10)
          );
        } catch (error) {
          console.log(error);
          failedUsers.push("<@" + user.userId + ">");
        }
      }
      await interaction.channel.send(
        `Refreshed data for ${successfulUserCount} users , failed users: ${
          failedUsers.join(", ") || "None"
        }`
      );
    } catch (error) {
      handleInteractionError(interaction, error);
    }
  },

  guildOnly: true,
  type: CommandType.SLASH,
  permissions: [PermissionFlagsBits.Administrator],
};
