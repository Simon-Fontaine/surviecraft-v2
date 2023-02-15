const { EmbedBuilder, AuditLogEvent } = require("discord.js");
const emojis = require("../../utilities/emojis");
const IDs = require("../../utilities/ids");

module.exports = async (oldMessage, newMessage, instance) => {
  if (!oldMessage.guild || oldMessage.author.bot || oldMessage.content === newMessage.content) {
    return;
  }

  const fetchedLogs = await oldMessage.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MessageDelete,
  });

  const deletionLog = fetchedLogs.entries.first();

  if (!deletionLog) {
    return;
  }

  const logChannel = oldMessage.guild.channels.cache.get(IDs.LOGS_CHANNEL);

  if (!logChannel) {
    return console.log(channelName + " channel not found !");
  }

  const Original = oldMessage.content.slice(0, 1000) + (oldMessage.content.length > 1000 ? " ..." : "");
  const Edited = newMessage.content.slice(0, 1000) + (newMessage.content.length > 1000 ? " ..." : "");

  const messageDeletedEmbed = new EmbedBuilder()
    .setColor("#2f3136")
    .setTitle("Edited Message result:")
    .addFields(
      { name: `Old Message:`, value: `${Original ? Original : "None"}` },
      { name: `New Message:`, value: `${Edited ? Edited : "None"}` }
    );

  if (newMessage.attachments.size >= 1) {
    messageDeletedEmbed.addFields({
      name: `Attachments:`,
      value: `${newMessage.attachments.map((img) => `[lien vers l'image](${img.url})`).join("\n")}`,
    });
  }

  messageDeletedEmbed.setDescription(
    [
      `${emojis.owner} Author: ${oldMessage.member} [\`${oldMessage.member.id}\`]`,
      `${emojis.channel} Channel: ${oldMessage.channel} [\`#${oldMessage.channel.name}\`]`,
    ].join("\n")
  );

  await logChannel.send({ embeds: [messageDeletedEmbed] }).catch((error) => {
    console.log(error);
  });
};
