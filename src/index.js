const path = require("path");

const { Client, IntentsBitField, ActivityType } = require("discord.js");
const WOK = require("wokcommands");
const mongoose = require("mongoose");

const { TOKEN, MONGO_URI } = process.env;
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


  for(const [_,guild] of client.guilds.cache){
    await guild.members.fetch().catch(console.error)
  }
  
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
