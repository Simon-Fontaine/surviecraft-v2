const { CommandType, CooldownTypes } = require("wokcommands");
const {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const { isHighStaff } = require("../../utilities/staff-util");
const TicketStaff = require("../../models/ticket-staff-schema");

module.exports = {
  description: "Effectue des actions rapides sur un ticket staff.",

  type: CommandType.SLASH,
  testOnly: true,
  guildOnly: true,

  cooldowns: {
    type: CooldownTypes.perUser,
    duration: "3 s",
  },

  options: [
    {
      name: "action",
      description: "Ajouter ou supprimer un membre de ce ticket.",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "➕ Add", value: "add" },
        { name: "➖ Remove", value: "remove" },
        { name: "❌ Close", value: "close" },
      ],
    },
    {
      name: "user",
      type: ApplicationCommandOptionType.User,
      description: "Choisissez un membre",
      required: false,
    },
  ],

  callback: async ({ interaction, guild, member, channel, text }) => {
    if (!isHighStaff(member)) {
      return interaction.reply({
        content: "Err: Vous n'avez pas la permission d'utiliser cette commande !",
        ephemeral: true,
      });
    }

    const action = interaction.options.getString("action");
    const ticketMember = interaction.options.getMember("user");

    if (action === "close" && ticketMember) {
      return interaction.reply({
        content: "Vous ne pouvez pas fermer un ticket en spécifiant un membre.",
        ephemeral: true,
      });
    }

    const ticket = await TicketStaff.findOne({ channel_id: channel.id });

    if (!ticket) {
      return interaction.reply({
        content: "Aucune donnée n'a été trouvée, ce salon n'est pas un ticket.",
        ephemeral: true,
      });
    }

    switch (action) {
      case "close":
        if (ticket.closed) {
          return interaction.reply({
            content: "Ce ticket est déjà fermé, veuillez patienter.",
            ephemeral: true,
          });
        } else {
          const modal = new ModalBuilder().setCustomId("ticket-staff-close-modal").setTitle("Fermeture du Ticket");

          const answerInput = new TextInputBuilder()
            .setCustomId("ticket-staff-close-modal-reason")
            .setLabel("📝 Indiquez une raison")
            .setRequired(true)
            .setStyle(TextInputStyle.Short);

          const firstActionRow = new ActionRowBuilder().addComponents(answerInput);

          modal.addComponents(firstActionRow);

          await interaction.showModal(modal);
        }
        break;
      case "add":
        if (!ticketMember) {
          return interaction.reply({
            content: "Veuillez spécifier un membre.",
            ephemeral: true,
          });
        } else if (ticket.users_id.includes(ticketMember.user.id)) {
          return interaction.reply({
            content: "Ce membre fait déjà partie de ce ticket.",
            ephemeral: true,
          });
        } else {
          ticket.users_id.push(ticketMember.user.id);

          channel.permissionOverwrites.edit(ticketMember.user.id, {
            SendMessages: true,
            ViewChannel: true,
            ReadMessageHistory: true,
          });

          ticket.save();
          interaction.reply({
            content: `Le membre ${ticketMember.user} a été ajouté au ticket.`,
            ephemeral: true,
          });
        }
        break;
      case "remove":
        if (!ticketMember) {
          return interaction.reply({
            content: "Veuillez spécifier un membre.",
            ephemeral: true,
          });
        } else if (!ticket.users_id.includes(ticketMember.user.id)) {
          return interaction.reply({
            content: "Ce membre ne fait pas partie de ce ticket.",
            ephemeral: true,
          });
        } else if (ticketMember.user.id === ticket.owner_id) {
          return interaction.reply({
            content: "Vous ne pouvez pas retirer le créateur du ticket.",
            ephemeral: true,
          });
        } else {
          ticket.users_id.remove(ticketMember.user.id);

          channel.permissionOverwrites.edit(ticketMember.user.id, {
            SendMessages: false,
            ViewChannel: false,
            ReadMessageHistory: false,
          });

          ticket.save();
          interaction.reply({
            content: `Le membre ${ticketMember.user} a été retiré du ticket.`,
            ephemeral: true,
          });
        }
        break;
    }
  },
};
