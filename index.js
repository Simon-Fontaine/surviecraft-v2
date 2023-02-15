const Discord = require("discord.js");
const WOK = require("wokcommands");
const path = require("path");
require("dotenv/config");

const client = new Discord.Client({
  intents: 131071,
});

client.on("ready", () => {
  new WOK({
    client,
    commandsDir: path.join(__dirname, "commands"),
    featuresDir: path.join(__dirname, "features"),
    events: {
      dir: path.join(__dirname, "events"),
    },
    mongoUri: process.env.MONGO_URI || "",
    testServers: ["400071438633271299"],
    botOwners: ["517770661733859329"],
    cooldownConfig: {
      errorMessage: "Veuillez attendre **{TIME}** avant de recommencer.",
      botOwnersBypass: true,
      dbRequired: 300,
    },
  });
});

client.login(process.env.TOKEN);
