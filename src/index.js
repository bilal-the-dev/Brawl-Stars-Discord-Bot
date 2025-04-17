const path = require("path");

const { Client, IntentsBitField, ActivityType } = require("discord.js");
const WOK = require("wokcommands");
const mongoose = require("mongoose");
const { CronJob } = require("cron");
const {
  refreshBrawlStarsInfo,
  generateLeaderboardData,
} = require("./utils/functions");

const { TOKEN, MONGO_URI, LEADERBOARD_CHANNEL_ID, GUILD_ID } = process.env;
const { DefaultCommands } = WOK;

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.MessageContent,
  ],
});
client.rest.on("rateLimited", console.log);

client.on("ready", async (readyClient) => {
  console.log(
    `${readyClient.user.username} (${readyClient.user.id}) is running!`
  );

  const guild = client.guilds.cache.get(GUILD_ID);
  const members = await guild.members.fetch().catch(console.error);
  console.log(`Fetched ${members?.size ?? 0} for guild ${guild.name}`);

  CronJob.from({
    cronTime: "0 50 23 * * *",
    onTick: async function () {
      try {
        console.log("Running leaderboard time");
        await refreshBrawlStarsInfo({ dailyRefresh: true });
        const guild = client.guilds.cache.get(GUILD_ID);

        const embeds = await generateLeaderboardData(guild, null, false);

        const channel = client.channels.cache.get(LEADERBOARD_CHANNEL_ID);

        for (const embed of embeds) await channel.send({ embeds: [embed] });
      } catch (error) {
        console.log(error);
      }
    },
    start: true,
    timeZone: "Europe/Rome",
  });
  await mongoose.connect(MONGO_URI);

  readyClient.user.setPresence({
    status: "dnd",
    activities: [
      { type: ActivityType.Custom, name: "Monitoring Brawl Stars Profile" },
    ],
  });

  new WOK({
    client,
    commandsDir: path.join(__dirname, "commands"),
    events: {
      dir: path.join(__dirname, "events"),
    },
    disabledDefaultCommands: [
      DefaultCommands.ChannelCommand,
      DefaultCommands.CustomCommand,
      DefaultCommands.Prefix,
      DefaultCommands.RequiredPermissions,
      DefaultCommands.RequiredRoles,
      DefaultCommands.ToggleCommand,
    ],
  });
});

client.login(TOKEN);
