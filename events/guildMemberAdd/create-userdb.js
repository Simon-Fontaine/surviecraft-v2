const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");
const userCaptchaSchema = require("../../models/user-captcha-schema");
const IDs = require("../../utilities/ids");
const wait = require("node:timers/promises").setTimeout;
const emojis = require("../../utilities/emojis");

module.exports = async (member, instance) => {
  if (member.user.bot) return;

  const isKicked = true;

  if (IDs.CAPTCHA_DESABLE) {
    const welcomeChannel = member.guild.channels.cache.get(IDs.WELCOME_CHANNEL);

    const embed = new EmbedBuilder()
      .setColor("Random")
      .setAuthor({
        name: "Bienvenue",
        iconURL: member.user.avatarURL({ dynamic: true }) ?? member.user.defaultAvatarURL,
      })
      .setDescription(
        [
          `Bienvenue dans notre communauté !`,
          `Nous vous invitons à vous familiariser avec notre <#${IDs.RULES_CHANNEL}>.`,
        ].join("\n")
      )
      .setFooter({
        text: `User: ${member.user.tag} | ID: ${member.user.id} | Nombre: ${member.guild.memberCount}`,
      });

    welcomeChannel.send({ content: `${member.user}`, embeds: [embed] });
  } else {
    member.roles.add(IDs.CAPTCHA_ROLE).catch(() => {});

    let result = await userCaptchaSchema.findOne({
      guild_id: `${member.guild.id}`,
      user_id: `${member.user.id}`,
    });

    if (!result) {
      await userCaptchaSchema.create({
        guild_id: `${member.guild.id}`,
        user_id: `${member.user.id}`,
      });
    } else {
      await userCaptchaSchema.findOneAndUpdate(
        {
          guild_id: `${member.guild.id}`,
          user_id: `${member.user.id}`,
        },
        { verified: false }
      );
    }

    await wait(180000);

    let lastResult = await userCaptchaSchema.findOne({
      guild_id: `${member.guild.id}`,
      user_id: `${member.user.id}`,
    });

    if (!lastResult.verified && isKicked) {
      const verificationEmbed = new EmbedBuilder()
        .setTitle(`${member.user.tag}'s Verification Result:`)
        .setColor("#2f3136")
        .setThumbnail(member.user.avatarURL({ dynamic: true }) ?? member.user.defaultAvatarURL)
        .setDescription(
          [
            `${emojis.profile} **Member:** ${member.user.tag} **[${member.user.id}]**`,
            `${emojis.creation} **Creation:** <t:${parseInt(member.user.createdTimestamp / 1000)}>`,
          ].join("\n")
        );

      let embedValue = [
        `${emojis.space}${emojis.cancel} \`${member.user.tag}\` has **failed** to pass verification in **3 minutes**.`,
      ];

      try {
        await member.kick("[CAPTCHA] Failed to verify [Timeout]");
        embedValue.push(`${emojis.space}${emojis.space}${emojis.kick} Member has been **kicked**!`);
      } catch (error) {
        embedValue.push(`${emojis.space}${emojis.space}${emojis.kick} Member could not be **kicked**!`);
      }

      verificationEmbed.addFields({
        name: "Status:",
        value: embedValue.join("\n"),
      });

      const logsChannel = member.guild.channels.cache.get(IDs.LOGS_CHANNEL);
      logsChannel.send({ embeds: [verificationEmbed] });
    }
  }
};
