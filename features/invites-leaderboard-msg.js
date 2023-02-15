const invitesMessageSchema = require("../models/invites-message-schema");
const { EmbedBuilder } = require("discord.js");
const IDs = require("../utilities/ids");

module.exports = async (instance, client) => {
  const updateMessage = async () => {
    const guild = client.guilds.cache.get(IDs.GUILD);
    const messageChannel = guild.channels.cache.get(IDs.INVITES_MESSAGE_CHANNEL);
    const channel = guild.channels.cache.get(IDs.INVITES_CHANNEL);

    const message = await messageChannel.messages.fetch(IDs.INVITES_MESSAGE);

    if (message) {
      let results = await invitesMessageSchema.findById(guild.id);

      const embed = new EmbedBuilder()
        .setTitle(`Classment des Invitations !`)
        .setColor("Gold")
        .setDescription(message.embeds[0].description)
        .setFooter({ text: "Refresh toutes les 15 minutes" })
        .setTimestamp();

      if (results) {
        const message = await channel.messages
          .fetch(results.messageId, {
            cache: true,
            force: true,
          })
          .catch(() => {});

        if (message) {
          message.edit({
            embeds: [embed],
          });
        } else {
          results = null;
        }
      }

      if (!results) {
        const message = await channel.send({
          embeds: [embed],
        });

        await invitesMessageSchema.findOneAndUpdate(
          {
            _id: guild.id,
          },
          {
            _id: guild.id,
            messageId: message.id,
          },
          {
            upsert: true,
          }
        );
      }
    }

    setTimeout(async () => {
      await updateMessage();
    }, 1000 * 60 * 5);
  };

  updateMessage();
};
