const { CommandType, CooldownTypes } = require("wokcommands");

module.exports = {
  description: "Replies with the roundtrip latency!",

  type: CommandType.SLASH,
  testOnly: true,
  guildOnly: true,

  cooldowns: {
    type: CooldownTypes.perUser,
    duration: "3 s",
  },

  callback: async ({ interaction, message, client }) => {
    const sent = await interaction.reply({ content: "Pinging...", fetchReply: true, ephemeral: true });
    const ms = sent.createdTimestamp - interaction.createdTimestamp;

    interaction.editReply({
      content: `Roundtrip latency: **${ms}**ms\nWebsocket heartbeat: **${client.ws.ping}**ms`,
      ephemeral: true,
    });
  },
};
