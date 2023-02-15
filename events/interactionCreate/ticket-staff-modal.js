const { EmbedBuilder } = require("discord.js");
const ticketStaffSchema = require("../../models/ticket-staff-schema");
const wait = require("node:timers/promises").setTimeout;
const emojis = require("../../utilities/emojis");
const IDs = require("../../utilities/ids");
const dayjs = require("dayjs");

module.exports = async (interaction, instance) => {
  if (!interaction.isModalSubmit()) return;

  const { customId, channel, guild } = interaction;

  if (customId !== "ticket-staff-close-modal") return;

  const reason = interaction.fields.getTextInputValue("ticket-staff-close-modal-reason");

  const transcriptChannel = guild.channels.cache.get(IDs.TICKET_STAFF_TRANSCRIPT);

  const ticket = await ticketStaffSchema.findOne({ channel_id: channel.id });

  if (!ticket) {
    return interaction.reply({
      content: "Aucune donnée n'a été trouvée concernant ce ticket, veuillez le supprimer manuellement.",
      ephemeral: true,
    });
  } else {
    if (ticket.closed) {
      return interaction.reply({
        content: "Ce ticket est déjà fermé, veuillez patienter.",
        ephemeral: true,
      });
    } else {
      await ticketStaffSchema.findOneAndUpdate({ channel_id: channel.id }, { closed: true });

      const logs = [];

      await channel.messages.fetch().then((messages) => {
        messages.forEach((msg) =>
          logs.push(
            `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}\n=> ${msg.content}${
              msg.attachments.size
                ? `\n[${msg.createdAt.toLocaleString()}] ${msg.author.tag}\n=> ${msg.attachments.first().url}`
                : ""
            }`
          )
        );
      });

      let file = [
        {
          attachment: Buffer.from(logs.join("\n")),
          name: `staff-${ticket.ticket_id}-${ticket.owner_tag}-Transcript.txt`,
        },
      ];

      const embed = new EmbedBuilder()
        .setTitle(`Ticket Staff #${ticket.ticket_id} de ${ticket.owner_tag}`)
        .setColor("#2f3136")
        .setDescription(
          [
            `${emojis.profile} **Overt Par:** ${ticket.owner_tag} [\`${ticket.owner_id}\`]`,
            `${emojis.cancel} **Fermé Par:** ${interaction.user.tag} [\`${interaction.user.id}\`]`,
            `${emojis.moderator} **Modérateur:** ${ticket.mod_tag} [\`${ticket.mod_id}\`]`,
            `${emojis.target} **Détail:**`,
            `${emojis.space}${emojis.doubleRightArrow} Type: \`${ticket.type}\``,
            `${emojis.space}${emojis.doubleRightArrow} Overt le: <t:${dayjs(ticket.createdAt).unix()}>`,
            `${emojis.space}${emojis.doubleRightArrow} Fermer le: <t:${dayjs().unix()}>`,
          ].join("\n")
        )
        .addFields({
          name: `${emojis.reason} Raison:`,
          value: `${reason}`,
        });

      const sentMessage = await transcriptChannel.send({ embeds: [embed], files: file });

      try {
        await interaction.client.users.cache.get(ticket.owner_id).send({
          embeds: [embed],
          files: file,
        });
      } catch {
        transcriptChannel.send(`**${ticket.owner_tag}** [${ticket.owner_id}] n'a pas pu être contacté.`);
      }

      interaction.reply({
        embeds: [
          embed.addFields({
            name: `${emojis.channel} Transcript:`,
            value: `[Accessible ici](${sentMessage.url})`,
          }),
        ],
      });

      wait(10000).then(() => {
        channel.delete();
      });
    }
  }
};
