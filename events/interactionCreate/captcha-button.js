const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");
const userCaptchaSchema = require("../../models/user-captcha-schema");
const { Captcha } = require("captcha-canvas");
const emojis = require("../../utilities/emojis");
const IDs = require("../../utilities/ids");

module.exports = async (interaction, instance) => {
  if (interaction.customId !== "captcha-verify") return;

  async function isBeingVerified(interaction) {
    let result = await userCaptchaSchema.findOne({
      guild_id: `${interaction.guild.id}`,
      user_id: `${interaction.user.id}`,
    });

    if (result.being_verified) return true;
    else return false;
  }

  let result = await userCaptchaSchema.findOne({
    guild_id: `${interaction.guild.id}`,
    user_id: `${interaction.user.id}`,
  });

  const failedOperationEmbed = new EmbedBuilder().setColor("DarkRed");

  if (!result) {
    result = await userCaptchaSchema.create({
      guild_id: `${interaction.guild.id}`,
      user_id: `${interaction.user.id}`,
    });
  }

  if (result.verified) {
    failedOperationEmbed.setDescription(
      [
        `${emojis.cancel} **Unsuccessful Operation!**`,
        `${emojis.space}${emojis.arrowRight} You are already verified!`,
      ].join("\n")
    );
    return interaction.reply({ embeds: [failedOperationEmbed], ephemeral: true });
  } else if (result.being_verified) {
    failedOperationEmbed.setDescription(
      [
        `${emojis.cancel} **Unsuccessful Operation!**`,
        `${emojis.space}${emojis.arrowRight} You are already being verified, complete the captcha!`,
      ].join("\n")
    );
    return interaction.reply({ embeds: [failedOperationEmbed], ephemeral: true });
  } else if (result.being_verified === false) {
    await userCaptchaSchema.findOneAndUpdate(
      {
        guild_id: `${interaction.guild.id}`,
        user_id: `${interaction.user.id}`,
      },
      { being_verified: true }
    );
  }

  const captcha = new Captcha();
  captcha.async = true;
  captcha.addDecoy({ total: 10 });
  captcha.drawTrace();
  captcha.drawCaptcha();

  const file = new AttachmentBuilder(await captcha.png, { name: "captcha.png" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("captcha-answer").setLabel("Answer").setStyle(ButtonStyle.Success)
  );

  const captchaEmbed = new EmbedBuilder()
    .setColor("#2f3136")
    .setImage("attachment://captcha.png")
    .addFields(
      {
        name: `${emojis.verification} Hello! Are you human? Let's find out!`,
        value: `\`Please type the captcha below to be able to access this server!\``,
      },
      {
        name: `Additional Notes:
      `,
        value: [
          `${emojis.tracedColored} Type out the traced colored characters from left to right.`,
          `${emojis.decoy} Ignore the decoy characters spread-around.`,
          `${emojis.nocase} You don't have to respect characters cases (upper/lower case)!`,
        ].join("\n"),
      }
    )
    .setFooter({ text: "Verification Period: 3 minutes" });

  interaction.reply({ embeds: [captchaEmbed], files: [file], components: [row], ephemeral: true });

  const filter = async (interaction) => {
    if (interaction.customId !== "captch-modal") return false;
    if (
      isBeingVerified(interaction) &&
      interaction.fields.getTextInputValue("captch-modal-answer").toLowerCase() === captcha.text.toLowerCase()
    ) {
      await interaction.reply({ content: "Verification done.", ephemeral: true });
      return true;
    } else {
      failedOperationEmbed.setDescription(
        [
          `${emojis.cancel} **Unsuccessful Operation!**`,
          `${emojis.space}${emojis.arrowRight} Wrong answer, try again before it's too late.`,
        ].join("\n")
      );
      await interaction.reply({ embeds: [failedOperationEmbed], ephemeral: true });
    }
  };

  const verificationEmbed = new EmbedBuilder()
    .setTitle(`${interaction.user.tag}'s Verification Result:`)
    .setColor("#2f3136")
    .setThumbnail(interaction.user.avatarURL({ dynamic: true }) ?? interaction.user.defaultAvatarURL)
    .setDescription(
      [
        `${emojis.profile} **Member:** ${interaction.user.tag} **[${interaction.user.id}]**`,
        `${emojis.creation} **Creation:** <t:${parseInt(interaction.user.createdTimestamp / 1000)}>`,
      ].join("\n")
    );

  try {
    const response = await interaction.awaitModalSubmit({ filter, time: 180000, error: ["time"] });

    if (response) {
      await userCaptchaSchema.findOneAndUpdate(
        {
          guild_id: `${interaction.guild.id}`,
          user_id: `${interaction.user.id}`,
        },
        { verified: true, being_verified: false }
      );

      const resultEmbed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("You have been verified!")
        .setDescription(
          `${emojis.success} You passed the verification successfully. You can now access \`${interaction.guild.name}\`!`
        );

      await interaction.followUp({ embeds: [resultEmbed], ephemeral: true });

      let embedValue = [
        `${emojis.space}${emojis.success} \`${interaction.user.tag}\` has passed verification successfully.`,
      ];

      try {
        await interaction.member.roles.remove(IDs.CAPTCHA_ROLE);
        embedValue.push(`${emojis.space}${emojis.space}${emojis.triangleRight} Auto roles have been assigned as well.`);
      } catch (error) {
        embedValue.push(`${emojis.space}${emojis.space}${emojis.triangleRight} Auto roles could not be assigned.`);
      }

      verificationEmbed.addFields({
        name: "Status:",
        value: embedValue.join("\n"),
      });

      const welcomeChannel = interaction.guild.channels.cache.get(IDs.WELCOME_CHANNEL);
      const logChannel = interaction.guild.channels.cache.get(IDs.LOGS_CHANNEL);

      logChannel.send({ embeds: [verificationEmbed] });

      const embed = new EmbedBuilder()
        .setColor("Random")
        .setAuthor({
          name: "Bienvenue",
          iconURL: interaction.user.avatarURL({ dynamic: true }) ?? interaction.user.defaultAvatarURL,
        })
        .setDescription(
          [
            `Bienvenue dans notre communauté !`,
            `Nous vous invitons à vous familiariser avec notre <#${IDs.RULES_CHANNEL}>.`,
          ].join("\n")
        )
        .setFooter({
          text: `User: ${interaction.user.tag} | ID: ${interaction.user.id} | Nombre: ${interaction.guild.memberCount}`,
        });

      welcomeChannel.send({ content: `${interaction.user}`, embeds: [embed] });
    }
  } catch (error) {
    await userCaptchaSchema.findOneAndUpdate(
      {
        guild_id: `${interaction.guild.id}`,
        user_id: `${interaction.user.id}`,
      },
      { being_verified: false }
    );
  }
};
