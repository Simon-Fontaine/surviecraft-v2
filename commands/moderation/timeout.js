const { CommandType, CooldownTypes } = require("wokcommands");
const { ApplicationCommandOptionType, PermissionFlagsBits, RESTJSONErrorCodes, EmbedBuilder } = require("discord.js");
const IDs = require("../../utilities/ids");
const { isStaff } = require("../../utilities/staff-util");
const historySchema = require("../../models/history-schema.js");
const emojis = require("../../utilities/emojis");
const dayjs = require("dayjs");

module.exports = {
  description: "Manage your server's timeouts",

  type: CommandType.SLASH,
  testOnly: true,
  guildOnly: true,

  cooldowns: {
    type: CooldownTypes.perUser,
    duration: "3 s",
  },

  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "add",
      description: "Timeout a member from your server",
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: "user",
          description: "Mention of the user you want to timeout",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "reason",
          description: "Type the reason for the timeout you want to issue",
          maxLength: 300,
          required: false,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "duration",
          description: "Type the duration in 5s 1h 30m format",
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
          description: "DM the user upon timing them out",
          required: false,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "remove",
      description: "Remove the timeout of a member",
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: "user",
          description: "Mention the user you want to remove the timeout from",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "reason",
          description: "Type the reason behind the timeout removal",
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
          description: "DM the user when removing their timeout",
          required: false,
        },
      ],
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

    const modlogsChannel = interaction.guild.channels.cache.get(IDs.MODLOGS_CHANNEL);
    const logsChannel = interaction.guild.channels.cache.get(IDs.LOGS_CHANNEL);

    const failedOperationEmbed = new EmbedBuilder().setColor("Red");

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

    const targetUser = interaction.options.getUser("user");
    const targetMember = interaction.options.getMember("user");

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

    if (interaction.options.getSubcommand() === "add") {
      const reason = interaction.options.getString("reason") || "No reason specified";
      const duration = interaction.options.getString("duration");
      const proof = interaction.options.getAttachment("proof");
      const dm = interaction.options.getBoolean("dm") || false;

      if (targetMember.isCommunicationDisabled()) {
        failedOperationEmbed.setDescription(
          [
            `${emojis.cancel} **Unsuccessful Operation!**`,
            `${emojis.space}${emojis.arrowRight} The user you are targeting is actively timed out`,
          ].join("\n")
        );
        return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
      }

      let time;
      let timeType;

      if (duration) {
        try {
          const split = duration.match(/\d+|\D+/g);
          time = parseInt(split[0]);
          timeType = split[1].toLowerCase();
        } catch (error) {
          failedOperationEmbed.setDescription(
            [
              `${emojis.cancel} **Unsuccessful Operation!**`,
              `${emojis.space}${emojis.arrowRight} The time you provided is not valid. Try again in this format: 1s / 1m / 1h / 1d`,
            ].join("\n")
          );
          return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
        }

        if (timeType === "h") {
          time *= 60 * 1000 * 60;
        } else if (timeType === "d") {
          time *= 60 * 1000 * 60 * 24;
        } else if (timeType === "m") {
          time *= 60 * 1000;
        } else if (timeType === "s") {
          time *= 1000;
        } else {
          failedOperationEmbed.setDescription(
            [
              `${emojis.cancel} **Unsuccessful Operation!**`,
              `${emojis.space}${emojis.arrowRight} The time you provided is not valid. Try again in this format: 1s / 1m / 1h / 1d`,
            ].join("\n")
          );
          return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
        }
      }

      let successfulMuteString = "No users were timed out!";
      let unsuccessfulMuteString = "All users were timed out!";

      const caseID = (await historySchema.count()) + 1;

      try {
        await targetMember
          .timeout(
            time ? time : 27 * 24 * 60 * 60 * 1000,
            `${reason} by ${interaction.user.tag}${duration ? ` for ${duration}` : ""}`
          )
          .then(async () => {
            await historySchema
              .create({
                case_id: caseID,
                type: "+timeout",
                type_name: `+Timeout${duration ? ` (${duration})` : ""}`,
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
                duration: `${duration}`,
              })
              .catch(async (error) => {
                failedOperationEmbed.setDescription(`Something went wrong with adding a timeout. \`\`\`${error}\`\`\``);
                return await interaction.editReply({ embeds: [failedOperationEmbed] });
              });

            if (dm) {
              const targetEmbed = new EmbedBuilder()
                .setColor("#2f3136")
                .setTitle(`You have been timed out in ${interaction.guild.name}${duration ? ` for ${duration}` : ""}!`)
                .setDescription(
                  [
                    `${emojis.reason} **Reason:** ${reason}`,
                    `${emojis.moderator} **Moderator:** ${interaction.user.tag}`,
                  ].join("\n")
                );
              targetUser.send({ embeds: [targetEmbed] }).catch(() => {});
            }
          });

        successfulMuteString = `${emojis.triangleRight} ${targetUser.tag} [\`${targetUser.id}\`]`;

        const modlogsMuteEmbed = new EmbedBuilder()
          .setColor("DarkBlue")
          .setThumbnail(targetUser.avatarURL({ dynamic: true }) ?? targetUser.defaultAvatarURL)
          .addFields(
            { name: `Case:`, value: `\`${caseID}\` ${emojis.success}`, inline: true },
            { name: `Type:`, value: `\`+Timeout${duration ? ` (${duration})` : ""}\``, inline: true },
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
          unsuccessfulMuteString = `${emojis.triangleRight} ${targetUser.tag} [\`${targetUser.id}\`]\n${emojis.space}${emojis.doubleRightArrow} Missing Permissions to timeout this user`;
        } else {
          unsuccessfulMuteString = `${emojis.triangleRight} ${targetUser.tag} [\`${targetUser.id}\`]\n${emojis.space}${emojis.doubleRightArrow} Unknown Error`;
        }
      }

      const logsMuteEmbed = new EmbedBuilder()
        .setTitle("Timeout result:")
        .setColor("#2f3136")
        .setDescription(
          [
            `${emojis.reason} **Reason:** ${reason}`,
            `${emojis.moderator} **Moderator:** ${interaction.user}`,
            `${emojis.target} **Details:**`,
            `${emojis.space}${emojis.doubleRightArrow} Duration: ${duration ? `\`${duration}\` ` : ""}${
              duration ? emojis.success : emojis.cancel
            }`,
            `${emojis.space}${emojis.doubleRightArrow} DM Members: ${dm ? emojis.success : emojis.cancel}`,
          ].join("\n")
        )
        .addFields(
          { name: `${emojis.success} Successful timeouts`, value: `${successfulMuteString}`, inline: false },
          { name: `${emojis.cancel} Unsuccessful timeouts`, value: `${unsuccessfulMuteString}`, inline: false }
        );

      logsChannel.send({ embeds: [logsMuteEmbed] });

      let descriptionString = [
        `${emojis.reason} **Reason:** ${reason}`,
        `${emojis.moderator} **Moderator:** ${interaction.user}`,
      ].join("\n");

      if (duration) {
        descriptionString += `\n${emojis.duration} **Duration:** \`${duration}\` ${emojis.success}`;
      }

      const responseEmbed = new EmbedBuilder()
        .setColor("#2f3136")
        .setTitle(`Timeout result:`)
        .setDescription(descriptionString);

      if (successfulMuteString === "No users were timed out!") {
        responseEmbed.addFields({
          name: `${emojis.cancel} Unsuccessful timeouts`,
          value: `${unsuccessfulMuteString}`,
          inline: false,
        });
      } else if (unsuccessfulMuteString === "All users were timed out!") {
        responseEmbed.addFields({
          name: `${emojis.success} Successful timeouts`,
          value: `${successfulMuteString}`,
          inline: false,
        });
      }

      await interaction.editReply({ embeds: [responseEmbed], ephemeral: true });
    } else if (interaction.options.getSubcommand() === "remove") {
      const reason = interaction.options.getString("reason") || "No reason specified";
      const proof = interaction.options.getAttachment("proof");
      const dm = interaction.options.getBoolean("dm") || false;

      if (!targetMember.isCommunicationDisabled()) {
        failedOperationEmbed.setDescription(
          [
            `${emojis.cancel} **Unsuccessful Operation!**`,
            `${emojis.space}${emojis.arrowRight} The user you are targeting is currently not timed out`,
          ].join("\n")
        );
        return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
      }

      let successfulMuteString = "No users were untimed out!";
      let unsuccessfulMuteString = "All users were untimed out!";

      const caseID = (await historySchema.count()) + 1;

      try {
        await targetMember.timeout(null, `${reason} by ${interaction.user.tag}`).then(async () => {
          await historySchema
            .create({
              case_id: caseID,
              type: "-timeout",
              type_name: `-Timeout`,
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
              failedOperationEmbed.setDescription(`Something went wrong with removing a timeout. \`\`\`${error}\`\`\``);
              return await interaction.editReply({ embeds: [failedOperationEmbed] });
            });

          if (dm) {
            const targetEmbed = new EmbedBuilder()
              .setColor("#2f3136")
              .setTitle(`Your timeout has been removed in ${interaction.guild.name}!`)
              .setDescription(
                [
                  `${emojis.reason} **Reason:** ${reason}`,
                  `${emojis.moderator} **Moderator:** ${interaction.user.tag}`,
                ].join("\n")
              );
            targetUser.send({ embeds: [targetEmbed] }).catch(() => {});
          }
        });

        successfulMuteString = `${emojis.triangleRight} ${targetUser.tag} [\`${targetUser.id}\`]`;

        const modlogsMuteEmbed = new EmbedBuilder()
          .setColor("Blue")
          .setThumbnail(targetUser.avatarURL({ dynamic: true }) ?? targetUser.defaultAvatarURL)
          .addFields(
            { name: `Case:`, value: `\`${caseID}\` ${emojis.success}`, inline: true },
            { name: `Type:`, value: `\`-Timeout\``, inline: true },
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
        // console.log(error);
        if (error.code === RESTJSONErrorCodes.MissingPermissions) {
          unsuccessfulMuteString = `${emojis.triangleRight} ${targetUser.tag} [\`${targetUser.id}\`]\n${emojis.space}${emojis.doubleRightArrow} Missing Permissions to remove this user timeout`;
        } else {
          unsuccessfulMuteString = `${emojis.triangleRight} ${targetUser.tag} [\`${targetUser.id}\`]\n${emojis.space}${emojis.doubleRightArrow} Unknown Error`;
        }
      }

      const logsMuteEmbed = new EmbedBuilder()
        .setTitle("Timeout Removal result:")
        .setColor("#2f3136")
        .setDescription(
          [`${emojis.reason} **Reason:** ${reason}`, `${emojis.moderator} **Moderator:** ${interaction.user}`].join(
            "\n"
          )
        )
        .addFields(
          { name: `${emojis.success} Successful TO-Removals`, value: `${successfulMuteString}`, inline: false },
          { name: `${emojis.cancel} Unsuccessful TO-Removals`, value: `${unsuccessfulMuteString}`, inline: false }
        );

      logsChannel.send({ embeds: [logsMuteEmbed] });

      const responseEmbed = new EmbedBuilder()
        .setColor("#2f3136")
        .setTitle(`Timeout Removal Result:`)
        .setDescription(
          [`${emojis.reason} **Reason:** ${reason}`, `${emojis.moderator} **Moderator:** ${interaction.user}`].join(
            "\n"
          )
        );

      if (successfulMuteString === "No users were untimed out!") {
        responseEmbed.addFields({
          name: `${emojis.cancel} Unsuccessful TO-Removals`,
          value: `${unsuccessfulMuteString}`,
          inline: false,
        });
      } else if (unsuccessfulMuteString === "All users were untimed out!") {
        responseEmbed.addFields({
          name: `${emojis.success} Successful TO-Removals`,
          value: `${successfulMuteString}`,
          inline: false,
        });
      }

      await interaction.editReply({ embeds: [responseEmbed], ephemeral: true });
    }
  },
};
