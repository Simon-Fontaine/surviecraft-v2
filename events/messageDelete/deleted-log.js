const { EmbedBuilder, AuditLogEvent } = require("discord.js");
const emojis = require("../../utilities/emojis");
const IDs = require("../../utilities/ids");

module.exports = async (message, instance) => {
  if (!message.guild || message.author.bot) {
    return;
  }

  const fetchedLogs = await message.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MessageDelete,
  });

  const deletionLog = fetchedLogs.entries.first();

  if (!deletionLog) {
    return;
  }

  const logChannel = message.guild.channels.cache.get(IDs.LOGS_CHANNEL);

  if (!logChannel) {
    return console.log(channelName + " channel not found !");
  }

  const { executor, target, extra, createdTimestamp } = deletionLog;

  const messageContent = message.content.slice(0, 1000) + (message.content.length > 1000 ? " ..." : "");

  const messageDeletedEmbed = new EmbedBuilder()
    .setColor("#2f3136")
    .setTitle("Deleted Message result:")
    .addFields({ name: `Deleted Message:`, value: `${messageContent ? messageContent : "None"}` });

  if (message.attachments.size >= 1) {
    messageDeletedEmbed.addFields({
      name: `Attachments:`,
      value: `${message.attachments.map((img) => `[lien vers l'image](${img.url})`).join("\n")}`,
    });
  }

  if (
    extra.channel.id === message.channel.id &&
    target.id === message.author.id &&
    createdTimestamp > Date.now() - 5000 &&
    extra.count >= 1
  ) {
    messageDeletedEmbed.setDescription(
      [
        `${emojis.owner} Author: ${message.member} [\`${message.member.id}\`]`,
        `${emojis.profile} Executor: ${executor} [\`${executor.id}\`]`,
        `${emojis.channel} Channel: ${message.channel} [\`#${message.channel.name}\`]`,
      ].join("\n")
    );

    await logChannel.send({ embeds: [messageDeletedEmbed] }).catch((error) => {
      console.log(error);
    });
  } else {
    messageDeletedEmbed.setDescription(
      [
        `${emojis.owner} Author: ${message.member} [\`${message.member.id}\`]`,
        `${emojis.profile} Executor: **lui-même** [\`Aucun\`]`,
        `${emojis.channel} Channel: ${message.channel} [\`#${message.channel.name}\`]`,
      ].join("\n")
    );

    await logChannel.send({ embeds: [messageDeletedEmbed] }).catch((error) => {
      console.log(error);
    });
  }
};
