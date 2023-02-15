const { CommandType, CooldownTypes } = require("wokcommands");
const { ApplicationCommandOptionType, RESTJSONErrorCodes, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const IDs = require("../../utilities/ids");
const { isStaff } = require("../../utilities/staff-util");
const historySchema = require("../../models/history-schema.js");
const emojis = require("../../utilities/emojis");
const dayjs = require("dayjs");

module.exports = {
  description: "Kick a certain member in your server",

  type: CommandType.SLASH,
  testOnly: true,
  guildOnly: true,

  delete: false,

  cooldowns: {
    type: CooldownTypes.perUser,
    duration: "3 s",
  },

  options: [
    {
      type: ApplicationCommandOptionType.User,
      name: "user",
      description: "Mention the user you want to kick",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "reason",
      description: "Type the reason for the kick you want to issue",
      maxLength: 300,
      required: false,
    },
    {
      type: ApplicationCommandOptionType.Attachment,
      name: "proof",
      description: "A screenshot or image that is considered proof",
      required: false,
    },
    {
      type: ApplicationCommandOptionType.Boolean,
      name: "dm",
      description: "DM the user before kicking",
      required: false,
    },
  ],

  callback: async ({ interaction }) => {
    await interaction.deferReply({ ephemeral: true });

    if (!isStaff(interaction.member)) {
      return interaction.editReply({
        content: "Err: Vous n'avez pas la permission d'utiliser cette commande !",
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getUser("user");
    const targetMember = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason") || "No reason specified";
    const proof = interaction.options.getAttachment("proof");
    const dm = interaction.options.getBoolean("dm") || false;

    const modlogsChannel = interaction.guild.channels.cache.get(IDs.MODLOGS_CHANNEL);
    const logsChannel = interaction.guild.channels.cache.get(IDs.LOGS_CHANNEL);

    const failedOperationEmbed = new EmbedBuilder().setColor("Red");

    let successfulMuteString = "No users were kicked!";
    let unsuccessfulMuteString = "All users were kicked!";

    if (!modlogsChannel) {
      failedOperationEmbed.setDescription(
        [
          `${emojis.cancel} **Unsuccessful Operation!**`,
          `${emojis.space}${emojis.arrowRight} The modlogs channel does not exist.`,
        ].join("\n")
      );
      return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
    }

    if (!logsChannel) {
      failedOperationEmbed.setDescription(
        [
          `${emojis.cancel} **Unsuccessful Operation!**`,
          `${emojis.space}${emojis.arrowRight} The logs channel does not exist.`,
        ].join("\n")
      );
      return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
    }

    if (targetUser.id === interaction.user.id) {
      failedOperationEmbed.setDescription(
        [
          `${emojis.cancel} **Unsuccessful Operation!**`,
          `${emojis.space}${emojis.arrowRight} You can't target yourself...`,
        ].join("\n")
      );
      return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
    }

    if (targetUser.id === interaction.client.user.id) {
      failedOperationEmbed.setDescription(
        [
          `${emojis.cancel} **Unsuccessful Operation!**`,
          `${emojis.space}${emojis.arrowRight} You can't target me...`,
        ].join("\n")
      );
      return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
    }

    if (!targetMember) {
      failedOperationEmbed.setDescription(
        [
          `${emojis.cancel} **Unsuccessful Operation!**`,
          `${emojis.space}${emojis.arrowRight} The user you provided is not a server member.`,
        ].join("\n")
      );
      return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
    }

    const caseID = (await historySchema.count()) + 1;

    try {
      if (targetMember.kickable && dm) {
        const targetEmbed = new EmbedBuilder()
          .setColor("#2f3136")
          .setTitle(`You have been kicked from ${interaction.guild.name}!`)
          .setDescription(
            [
              `${emojis.reason} **Reason:** ${reason}`,
              `${emojis.moderator} **Moderator:** ${interaction.user.tag}`,
            ].join("\n")
          );
        targetUser.send({ embeds: [targetEmbed] }).catch(() => {});
      }
      await targetMember.kick(`${reason} by ${interaction.user.tag}`).then(async () => {
        await historySchema
          .create({
            case_id: caseID,
            type: "+kick",
            type_name: `Kick`,
            user_tag: `${targetUser.tag}`,
            user_id: `${targetUser.id}`,
            user_avatar: `${targetUser.avatarURL({ dynamic: true }) ?? targetUser.defaultAvatarURL}`,
            mod_tag: `${interaction.user.tag}`,
            mod_id: `${interaction.user.id}`,
            reason: `${reason}`,
            msg_id: ``,
            guild_id: `${interaction.guild.id}`,
            unix_time: `${dayjs().unix()}`,
            format_time: `${dayjs().format("MMM D[,] YYYY H[:]mm A")}`,
          })
          .catch(async (error) => {
            failedOperationEmbed.setDescription(`Something went wrong with adding a kick. \`\`\`${error}\`\`\``);
            return await interaction.editReply({ embeds: [failedOperationEmbed] });
          });
      });

      successfulMuteString = `${emojis.triangleRight} ${targetUser.tag} [\`${targetUser.id}\`]`;

      const modlogsMuteEmbed = new EmbedBuilder()
        .setColor("Gold")
        .setThumbnail(targetUser.avatarURL({ dynamic: true }) ?? targetUser.defaultAvatarURL)
        .addFields(
          { name: `Case:`, value: `\`${caseID}\` ${emojis.success}`, inline: true },
          { name: `Type:`, value: `\`Kick\``, inline: true },
          {
            name: `Moderator:`,
            value: `\`${interaction.user.tag}\` ${emojis.moderator}`,
            inline: true,
          },
          { name: `Target:`, value: `${emojis.triangleRight} \`${targetUser.tag}\` ${emojis.target}` },
          { name: `Reason:`, value: `${reason}` }
        )
        .setFooter({ text: dayjs().format("MMM D[,] YYYY H[:]mm A") });

      if (proof) {
        const sent = await modlogsChannel.send({ embeds: [modlogsMuteEmbed], files: [proof], fetchReply: true });
        await historySchema.findOneAndUpdate({ case_id: caseID }, { msg_id: sent.id });
      } else {
        const sent = await modlogsChannel.send({ embeds: [modlogsMuteEmbed], fetchReply: true });
        await historySchema.findOneAndUpdate({ case_id: caseID }, { msg_id: sent.id });
      }
    } catch (error) {
      if (error.code === RESTJSONErrorCodes.MissingPermissions) {
        unsuccessfulMuteString = `${emojis.triangleRight} ${targetUser.tag} [\`${targetUser.id}\`]\n${emojis.space}${emojis.doubleRightArrow} Missing Permissions to kick this user`;
      } else {
        unsuccessfulMuteString = `${emojis.triangleRight} ${targetUser.tag} [\`${targetUser.id}\`]\n${emojis.space}${emojis.doubleRightArrow} Unknown Error`;
      }
    }

    const logsMuteEmbed = new EmbedBuilder()
      .setTitle("Kick result:")
      .setColor("#2f3136")
      .setDescription(
        [
          `${emojis.reason} **Reason:** ${reason}`,
          `${emojis.moderator} **Moderator:** ${interaction.user}`,
          `${emojis.target} **Details:**`,
          `${emojis.space}${emojis.doubleRightArrow} DM Members: ${dm ? emojis.success : emojis.cancel}`,
        ].join("\n")
      )
      .addFields(
        { name: `${emojis.success} Successful kicks`, value: `${successfulMuteString}`, inline: false },
        { name: `${emojis.cancel} Unsuccessful kicks`, value: `${unsuccessfulMuteString}`, inline: false }
      );

    logsChannel.send({ embeds: [logsMuteEmbed] });

    const responseEmbed = new EmbedBuilder()
      .setColor("#2f3136")
      .setTitle(`Kick result:`)
      .setDescription(
        [`${emojis.reason} **Reason:** ${reason}`, `${emojis.moderator} **Moderator:** ${interaction.user}`].join("\n")
      );

    if (successfulMuteString === "No users were kicked!") {
      responseEmbed.addFields({
        name: `${emojis.cancel} Unsuccessful kicks`,
        value: `${unsuccessfulMuteString}`,
        inline: false,
      });
    } else if (unsuccessfulMuteString === "All users were kicked!") {
      responseEmbed.addFields({
        name: `${emojis.success} Successful kicks`,
        value: `${successfulMuteString}`,
        inline: false,
      });
    }

    await interaction.editReply({ embeds: [responseEmbed], ephemeral: true });
  },
};
