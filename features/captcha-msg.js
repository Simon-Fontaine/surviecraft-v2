const captchaMessageSchema = require("../models/message-captcha-schema");
const { ActionRowBuilder, ButtonBuilder, Events, EmbedBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");
const emojis = require("../utilities/emojis");
const IDs = require("../utilities/ids");

module.exports = async (instance, client) => {
  const guild = client.guilds.cache.get(IDs.GUILD);
  const channel = guild.channels.cache.get(IDs.CAPTCHA_CHANNEL);

  let results = await captchaMessageSchema.findById(guild.id);

  const rows = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("captcha-verify").setLabel("Verify").setStyle(ButtonStyle.Success)
  );

  const embed = new EmbedBuilder()
    .setTitle(`${emojis.verification} Verification Required!`)
    .setColor("#2f3136")
    .setDescription(
      [
        `${emojis.space}${emojis.alarm} **To access \`${guild.name}\`, you need to pass the verification first.**`,
        `${emojis.space}${emojis.space}${emojis.triangleRight} Press on the **Verify** button below.`,
      ].join("\n")
    );

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
        components: [rows],
      });
    } else {
      results = null;
    }
  }

  if (!results) {
    const message = await channel.send({
      embeds: [embed],
      components: [rows],
    });

    await captchaMessageSchema.findOneAndUpdate(
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
};
