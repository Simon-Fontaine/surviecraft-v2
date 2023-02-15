const { CommandType, CooldownTypes } = require("wokcommands");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  description: "Lance une pièce.",

  type: CommandType.SLASH,
  testOnly: true,
  guildOnly: false,

  cooldowns: {
    type: CooldownTypes.perUser,
    duration: "10 s",
  },

  callback: async ({ interaction }) => {
    await interaction.deferReply({ ephemeral: true });

    const flip = Math.random() < 0.5 ? "PILE" : "FACE";

    const reply = new EmbedBuilder()
      .setColor("Yellow")
      .setDescription(`\`\`\`css\n🪙 La pièce est tombée sur [${flip}]\`\`\``);

    return interaction.editReply({
      embeds: [reply],
      ephemeral: true,
    });
  },
};
