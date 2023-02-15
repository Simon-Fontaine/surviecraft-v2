const { CommandType, CooldownTypes } = require("wokcommands");
const { isStaff } = require("../../utilities/staff-util");

module.exports = {
  description: "Renvoie un message pour séparer les messages",

  type: CommandType.SLASH,
  testOnly: true,
  guildOnly: true,

  cooldowns: {
    type: CooldownTypes.perUser,
    duration: "3 s",
  },

  callback: async ({ interaction, member, channel }) => {
    await interaction.deferReply({ ephemeral: true });

    if (!isStaff(member)) {
      return interaction.editReply({
        content: `Err: Vous n'avez pas la permission d'utiliser cette commande !`,
      });
    }

    channel
      .send({
        content: `━━━━━━━━━━━━━━━━━━━━━━━━`,
      })
      .then(() => {
        interaction.editReply({ content: "Done !", ephemeral: true });
      });
  },
};
