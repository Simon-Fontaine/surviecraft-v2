const { CommandType, CooldownTypes } = require("wokcommands");

module.exports = {
  description: "Documentation du bot Discord!",

  type: CommandType.SLASH,
  testOnly: true,
  guildOnly: true,

  cooldowns: {
    type: CooldownTypes.perUser,
    duration: "3 s",
  },

  callback: async ({ interaction }) => {
    interaction.reply({
      content: `Voici ma documentation: https://scbots.gitbook.io/surviecraft/`,
      ephemeral: true,
    });
  },
};
