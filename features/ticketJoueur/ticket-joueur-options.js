const {
  ActionRowBuilder,
  Events,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const ticketJoueurSchema = require("../../models/ticket-joueur-schema");
const emojis = require("../../utilities/emojis");
const { isStaff } = require("../../utilities/staff-util");

module.exports = async (instance, client) => {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;

    const { customId, member, channel } = interaction;

    if (!["close", "lock", "unlock", "claim"].includes(customId)) return;

    if (!isStaff(member)) {
      return interaction.reply({
        content: "**Oh Oh**, il me semble que vous ne **faites pas** parti du Staff.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder();

    const ticket = await ticketJoueurSchema.findOne({ channel_id: channel.id });
    if (!ticket) {
      return interaction.reply({
        content: "Aucune donnée n'a été trouvée concernant ce ticket, veuillez le supprimer manuellement.",
        ephemeral: true,
      });
    }

    switch (customId) {
      case "close":
        if (ticket.closed) {
          return interaction.reply({
            content: "Ce ticket est déjà fermé, veuillez patienter.",
            ephemeral: true,
          });
        } else {
          const modal = new ModalBuilder().setCustomId("ticket-joueur-close-modal").setTitle("Fermeture du Ticket");

          const answerInput = new TextInputBuilder()
            .setCustomId("ticket-joueur-close-modal-reason")
            .setLabel("📝 Indiquez une raison")
            .setRequired(true)
            .setStyle(TextInputStyle.Short);

          const firstActionRow = new ActionRowBuilder().addComponents(answerInput);

          modal.addComponents(firstActionRow);

          await interaction.showModal(modal);
        }
        break;
      case "lock":
        if (ticket.locked) {
          return interaction.reply({
            content: "Ce ticket est déjà verrouillé",
            ephemeral: true,
          });
        } else {
          await ticketJoueurSchema.findOneAndUpdate({ channel_id: channel.id }, { locked: true });

          ticket.users_id.forEach((id) => {
            channel.permissionOverwrites.edit(id, {
              SendMessages: false,
            });
          });

          embed.setColor("Red").setDescription(`🔒 | Ce ticket a été verrouillé par **${interaction.user.tag}**`);
          interaction.reply({ embeds: [embed] });
        }
        break;
      case "unlock":
        if (!ticket.locked) {
          return interaction.reply({
            content: "Ce ticket est déjà déverrouillé",
            ephemeral: true,
          });
        } else {
          await ticketJoueurSchema.findOneAndUpdate({ channel_id: channel.id }, { locked: false });

          ticket.users_id.forEach((id) => {
            channel.permissionOverwrites.edit(id, {
              SendMessages: true,
            });
          });

          embed.setColor("Green").setDescription(`🔓 | Ce ticket a été déverrouillé par **${member.user.tag}**`);
          interaction.reply({ embeds: [embed] });
        }
        break;
      case "claim":
        if (ticket.claimed) {
          return interaction.reply({
            content: `Ce ticket est déjà pris en charge par **${ticket.mod_tag}**`,
            ephemeral: true,
          });
        } else {
          await ticketJoueurSchema.findOneAndUpdate(
            { channel_id: channel.id },
            { mod_tag: `${member.user.tag}`, mod_id: `${member.user.id}`, claimed: true }
          );

          embed
            .setColor("Green")
            .setDescription(`${emojis.moderator} | Ce ticket va être pris en charge par **${member.user.tag}**`);
          interaction.reply({ embeds: [embed] });
        }
        break;
    }
  });
};
