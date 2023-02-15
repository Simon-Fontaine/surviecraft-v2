const { CommandType, CooldownTypes } = require("wokcommands");
const { ApplicationCommandOptionType, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const IDs = require("../../utilities/ids");
const { isStaff } = require("../../utilities/staff-util");
const historySchema = require("../../models/history-schema.js");
const emojis = require("../../utilities/emojis");
const dayjs = require("dayjs");

module.exports = {
  description: "Warn a certain member in your server",

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
      description: "Mention the user you want to warn",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "reason",
      description: "Type the reason on why you are warning them",
      maxLength: 300,
      required: true,
    },
    {
      type: ApplicationCommandOptionType.Attachment,
      name: "proof",
      description: "A screenshot or image that is considered proof",
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

    const target = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");
    const proof = interaction.options.getAttachment("proof");

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

    if (target.id === interaction.user.id) {
      failedOperationEmbed.setDescription(
        [
          `${emojis.cancel} **Unsuccessful Operation!**`,
          `${emojis.space}${emojis.arrowRight} You can't warn yourself...`,
        ].join("\n")
      );
      return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
    }

    if (target.id === interaction.client.user.id) {
      failedOperationEmbed.setDescription(
        [
          `${emojis.cancel} **Unsuccessful Operation!**`,
          `${emojis.space}${emojis.arrowRight} You can't warn me...`,
        ].join("\n")
      );
      return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
    }

    const caseID = (await historySchema.count()) + 1;

    try {
      await historySchema.create({
        case_id: caseID,
        type: "+warn",
        type_name: "+Warn",
        user_tag: `${target.tag}`,
        user_id: `${target.id}`,
        user_avatar: `${target.avatarURL({ dynamic: true }) ?? target.defaultAvatarURL}`,
        mod_tag: `${interaction.user.tag}`,
        mod_id: `${interaction.user.id}`,
        msg_id: ``,
        guild_id: `${interaction.guild.id}`,
        unix_time: `${dayjs().unix()}`,
        format_time: `${dayjs().format("MMM D[,] YYYY H[:]mm A")}`,
        reason: `${reason}`,
      });

      const modLogsEmbed = new EmbedBuilder()
        .setColor("Purple")
        .setThumbnail(target.avatarURL({ dynamic: true }) ?? target.defaultAvatarURL)
        .addFields(
          { name: `Case:`, value: `\`${caseID}\` ${emojis.success}`, inline: true },
          { name: `Type:`, value: `\`Warn\``, inline: true },
          {
            name: `Moderator:`,
            value: `\`${interaction.user.tag}\` ${emojis.moderator}`,
            inline: true,
          },
          { name: `Target:`, value: `${emojis.triangleRight} \`${target.tag}\` ${emojis.target}` },
          { name: `Reason:`, value: `${reason}` }
        )
        .setFooter({ text: dayjs().format("MMM D[,] YYYY H[:]mm A") });

      if (proof) {
        const sent = await modlogsChannel.send({ embeds: [modLogsEmbed], files: [proof], fetchReply: true });
        await historySchema.findOneAndUpdate({ case_id: caseID }, { msg_id: sent.id });
      } else {
        const sent = await modlogsChannel.send({ embeds: [modLogsEmbed], fetchReply: true });
        await historySchema.findOneAndUpdate({ case_id: caseID }, { msg_id: sent.id });
      }

      const targetEmbed = new EmbedBuilder()
        .setColor("#2f3136")
        .setTitle(`You have been warned in ${interaction.guild.name}!`)
        .setDescription(
          [`${emojis.reason} **Reason:** ${reason}`, `${emojis.moderator} **Moderator:** ${interaction.user.tag}`].join(
            "\n"
          )
        );

      target.send({ embeds: [targetEmbed] }).catch(() => {});

      const successEmbed = new EmbedBuilder()
        .setColor("#2f3136")
        .setTitle("Warn result:")
        .setDescription(
          [`${emojis.reason} **Reason:** ${reason}`, `${emojis.moderator} **Moderator:** ${interaction.user}`].join(
            "\n"
          )
        )
        .addFields({ name: "Warned:", value: `${emojis.space}${emojis.success}${target.tag} [\`${target.id}\`]` });

      logsChannel.send({ embeds: [successEmbed] });
      return await interaction.editReply({ embeds: [successEmbed], ephemeral: true });
    } catch (error) {
      console.log(error);
      failedOperationEmbed.setDescription(`Something went wrong with adding a warn. \`\`\`${error}\`\`\``);
      return await interaction.editReply({ embeds: [failedOperationEmbed] });
    }
  },
};
