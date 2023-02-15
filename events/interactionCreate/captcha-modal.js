const {
  ActionRowBuilder,
  Events,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const userCaptchaSchema = require("../../models/user-captcha-schema");
const emojis = require("../../utilities/emojis");

module.exports = async (interaction, instance) => {
  if (interaction.customId !== "captcha-answer") return;

  let result = await userCaptchaSchema.findOne({
    guild_id: `${interaction.guild.id}`,
    user_id: `${interaction.user.id}`,
  });

  const failedOperationEmbed = new EmbedBuilder().setColor("DarkRed");

  if (result.verified) {
    failedOperationEmbed.setDescription(
      [
        `${emojis.cancel} **Unsuccessful Operation!**`,
        `${emojis.space}${emojis.arrowRight} You are already verified!`,
      ].join("\n")
    );
    return interaction.reply({ embeds: [failedOperationEmbed], ephemeral: true });
  } else if (!result.being_verified) {
    failedOperationEmbed.setDescription(
      [
        `${emojis.cancel} **Unsuccessful Operation!**`,
        `${emojis.space}${emojis.arrowRight} You are not being verified, click on **Verify**!`,
      ].join("\n")
    );
    return interaction.reply({ embeds: [failedOperationEmbed], ephemeral: true });
  }

  const modal = new ModalBuilder().setCustomId("captch-modal").setTitle("Captch Answer");

  const answerInput = new TextInputBuilder()
    .setCustomId("captch-modal-answer")
    .setLabel("Anwser")
    .setRequired(true)
    .setStyle(TextInputStyle.Short);

  const firstActionRow = new ActionRowBuilder().addComponents(answerInput);

  modal.addComponents(firstActionRow);

  await interaction.showModal(modal);
};
