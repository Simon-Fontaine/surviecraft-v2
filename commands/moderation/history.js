const { CommandType, CooldownTypes } = require("wokcommands");
const { ApplicationCommandOptionType, PermissionFlagsBits, ButtonStyle, EmbedBuilder } = require("discord.js");
const IDs = require("../../utilities/ids");
const { isStaff } = require("../../utilities/staff-util");
const Pagination = require("customizable-discordjs-pagination");
const emojis = require("../../utilities/emojis");
const historySchema = require("../../models/history-schema.js");

module.exports = {
  description: "Manage your server's moderation cases",

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
      type: ApplicationCommandOptionType.Subcommand,
      name: "view",
      description: "View your server's cases or a specific one, check the case of a certain member too",
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: "case",
          description: "The case ID",
          minValue: 1,
          required: false,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "type",
          description: "Wich kind of cases to filter",
          choices: [
            { name: "Ban", value: "+ban" },
            { name: "Kick", value: "+kick" },
            { name: "Timeout", value: "+timeout" },
            { name: "Warn", value: "+warn" },
            { name: "Timeout Removal", value: "-timeout" },
            { name: "Unban", value: "-ban" },
          ],
          required: false,
        },
        {
          type: ApplicationCommandOptionType.User,
          name: "user",
          description: "Cases of this user",
          required: false,
        },
        {
          type: ApplicationCommandOptionType.User,
          name: "mod",
          description: "Moderation acrtions made by this staff",
          required: false,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "modify",
      description: "Modify a certain moderation case",
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: "case",
          description: "The case ID",
          minValue: 1,
          required: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "reason",
          description: "The new reason for this case",
          maxLength: 300,
          required: false,
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: "state",
          description: "Whether this case should be active or not",
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

    if (interaction.options.getSubcommand() === "view") {
      const caseID = interaction.options.getInteger("case");
      const caseType = interaction.options.getString("type");
      const user = interaction.options.getUser("user");
      const mod = interaction.options.getUser("mod");

      let typeName;

      if (caseType) {
        if (caseType === "+warn") {
          typeName = "Warn";
        } else if (caseType === "+timeout") {
          typeName = "+Timeout";
        } else if (caseType === "-timeout") {
          typeName = "-Timeout";
        } else if (caseType === "+kick") {
          typeName = "Kick";
        } else if (caseType === "+ban") {
          typeName = "Ban";
        } else if (caseType === "-ban") {
          typeName = "Unban";
        }
      }

      if (user && mod) {
        failedOperationEmbed.setDescription(
          [
            `${emojis.cancel} **Unsuccessful Operation!**`,
            `${emojis.space}${emojis.arrowRight} You can't filter by both user and moderator.`,
          ].join("\n")
        );
        return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
      } else if (caseID && (caseType || user || mod)) {
        failedOperationEmbed.setDescription(
          [
            `${emojis.cancel} **Unsuccessful Operation!**`,
            `${emojis.space}${emojis.arrowRight} You can't filter by both case ID and other filters.`,
          ].join("\n")
        );
        return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
      } else if (caseID && (!caseType || !user || !mod)) {
        const caseData = await historySchema.findOne({ guild_id: `${interaction.guild.id}`, case_id: caseID });

        if (caseData === null) {
          failedOperationEmbed.setDescription(
            [
              `${emojis.cancel} **Unsuccessful Operation!**`,
              `${emojis.space}${emojis.arrowRight} This case does not exist.`,
            ].join("\n")
          );
          return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
        }

        let color = "";

        switch (caseData.type) {
          case "+ban":
            color = "DarkRed";
            break;
          case "+warn":
            color = "Purple";
            break;
          case "+kick":
            color = "Gold";
            break;
          case "+timeout":
            color = "DarkBlue";
            break;
          case "-ban":
            color = "Orange";
            break;
          case "-timeout":
            color = "Blue";
            break;
        }

        const caseEmbed = new EmbedBuilder()
          .setColor(color)
          .setThumbnail(caseData.user_avatar)
          .addFields(
            {
              name: `Case:`,
              value: `\`${caseID}\` ${caseData.opened === true ? emojis.success : emojis.cancel}`,
              inline: true,
            },
            { name: `Type:`, value: `\`${caseData.type_name}\``, inline: true },
            {
              name: `Moderator:`,
              value: `\`${caseData.mod_tag}\` ${emojis.moderator}`,
              inline: true,
            },
            { name: `Target:`, value: `${emojis.triangleRight} \`${caseData.user_tag}\` ${caseData.user_id}` },
            { name: `Reason${caseData.edited ? " (Edited)" : ""}:`, value: `\`${caseData.reason}\`` }
          )
          .setFooter({ text: caseData.format_time });

        return await interaction.editReply({ embeds: [caseEmbed], ephemeral: true });
      } else if (!caseType && !user && !mod && !caseID) {
        const caseData = await historySchema.find({ guild_id: `${interaction.guild.id}` });

        if (caseData.length < 1) {
          failedOperationEmbed.setDescription(
            [
              `${emojis.cancel} **Unsuccessful Operation!**`,
              `${emojis.space}${emojis.arrowRight} There are no cases in the database.`,
            ].join("\n")
          );
          return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
        }

        let caseString = "";
        let caseStrings = [];
        for (let i = 0; i < caseData.length; i++) {
          caseString += caseString.length < 1 ? "" : "\n ";
          caseString += `${caseData[i].opened === true ? emojis.success : emojis.cancel} \`${
            caseData[i].case_id
          }\` **[${caseData[i].type.toUpperCase()}]** <t:${caseData[i].unix_time}:R>`;

          if (!((i + 1) % 10) || i + 1 === caseData.length) {
            caseStrings.push(caseString);
            caseString = "";
          }
        }

        const caseEmbed = caseStrings.map(
          (data) =>
            new EmbedBuilder({
              title: `${interaction.guild.name} Mod Cases (${caseData.length}):`,
              description: data,
            })
        );

        const buttons = [
          { emoji: emojis.doubleLeftArrow, style: ButtonStyle.Secondary },
          { emoji: emojis.arrowLeft, style: ButtonStyle.Secondary },
          { emoji: emojis.arrowRight, style: ButtonStyle.Secondary },
          { emoji: emojis.doubleRightArrow, style: ButtonStyle.Secondary },
        ];

        new Pagination()
          .setCommand(interaction)
          .setPages(caseEmbed)
          .setButtons(buttons)
          .setPaginationCollector({ components: "disappear", timeout: 30000, ephemeral: true })
          .setSelectMenu({ enable: false })
          .setFooter({ option: "default" })
          .send();
      } else if (user) {
        if (caseType) {
          const caseData = await historySchema.find({
            guild_id: `${interaction.guild.id}`,
            type: caseType,
            user_id: `${user.id}`,
          });

          if (caseData.length < 1) {
            failedOperationEmbed.setDescription(
              [
                `${emojis.cancel} **Unsuccessful Operation!**`,
                `${emojis.space}${emojis.arrowRight} There are no cases of type \`${typeName}\` for ${user.tag} in the database.`,
              ].join("\n")
            );
            return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
          }

          let caseString = "";
          let caseStrings = [];

          for (let i = 0; i < caseData.length; i++) {
            caseString += caseString.length < 1 ? "" : "\n ";
            caseString += `${caseData[i].opened === true ? emojis.success : emojis.cancel} \`${
              caseData[i].case_id
            }\` **[${caseData[i].type.toUpperCase()}]** <t:${caseData[i].unix_time}:R>`;

            if (!((i + 1) % 10) || i + 1 === caseData.length) {
              caseStrings.push(caseString);
              caseString = "";
            }
          }

          const caseEmbed = caseStrings.map(
            (data) =>
              new EmbedBuilder({
                title: `${user.tag} ${typeName} Cases (${caseData.length}):`,
                description: data,
              })
          );

          const buttons = [
            { emoji: emojis.doubleLeftArrow, style: ButtonStyle.Secondary },
            { emoji: emojis.arrowLeft, style: ButtonStyle.Secondary },
            { emoji: emojis.arrowRight, style: ButtonStyle.Secondary },
            { emoji: emojis.doubleRightArrow, style: ButtonStyle.Secondary },
          ];

          new Pagination()
            .setCommand(interaction)
            .setPages(caseEmbed)
            .setButtons(buttons)
            .setPaginationCollector({ components: "disappear", timeout: 30000, ephemeral: true })
            .setSelectMenu({ enable: false })
            .setFooter({ option: "default" })
            .send();
        } else {
          const caseData = await historySchema.find({ guild_id: `${interaction.guild.id}`, user_id: `${user.id}` });

          if (caseData.length < 1) {
            failedOperationEmbed.setDescription(
              [
                `${emojis.cancel} **Unsuccessful Operation!**`,
                `${emojis.space}${emojis.arrowRight} There are no cases for ${user.tag} in the database.`,
              ].join("\n")
            );
            return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
          }

          let caseString = "";
          let caseStrings = [];

          for (let i = 0; i < caseData.length; i++) {
            caseString += caseString.length < 1 ? "" : "\n ";
            caseString += `${caseData[i].opened === true ? emojis.success : emojis.cancel} \`${
              caseData[i].case_id
            }\` **[${caseData[i].type.toUpperCase()}]** <t:${caseData[i].unix_time}:R>`;

            if (!((i + 1) % 10) || i + 1 === caseData.length) {
              caseStrings.push(caseString);
              caseString = "";
            }
          }

          const caseEmbed = caseStrings.map(
            (data) =>
              new EmbedBuilder({
                title: `${user.tag} Mod Cases (${caseData.length}):`,
                description: data,
              })
          );

          const buttons = [
            { emoji: emojis.doubleLeftArrow, style: ButtonStyle.Secondary },
            { emoji: emojis.arrowLeft, style: ButtonStyle.Secondary },
            { emoji: emojis.arrowRight, style: ButtonStyle.Secondary },
            { emoji: emojis.doubleRightArrow, style: ButtonStyle.Secondary },
          ];

          new Pagination()
            .setCommand(interaction)
            .setPages(caseEmbed)
            .setButtons(buttons)
            .setPaginationCollector({ components: "disappear", timeout: 30000, ephemeral: true })
            .setSelectMenu({ enable: false })
            .setFooter({ option: "default" })
            .send();
        }
      } else if (mod) {
        if (caseType) {
          const caseData = await historySchema.find({
            guild_id: `${interaction.guild.id}`,
            type: caseType,
            mod_id: `${mod.id}`,
          });

          if (caseData.length < 1) {
            failedOperationEmbed.setDescription(
              [
                `${emojis.cancel} **Unsuccessful Operation!**`,
                `${emojis.space}${emojis.arrowRight} There are no cases of type \`${typeName}\` for ${mod.tag} in the database.`,
              ].join("\n")
            );
            return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
          }

          let caseString = "";
          let caseStrings = [];

          for (let i = 0; i < caseData.length; i++) {
            caseString += caseString.length < 1 ? "" : "\n ";
            caseString += `${caseData[i].opened === true ? emojis.success : emojis.cancel} \`${
              caseData[i].case_id
            }\` **[${caseData[i].type.toUpperCase()}]** <t:${caseData[i].unix_time}:R>`;

            if (!((i + 1) % 10) || i + 1 === caseData.length) {
              caseStrings.push(caseString);
              caseString = "";
            }
          }

          const caseEmbed = caseStrings.map(
            (data) =>
              new EmbedBuilder({
                title: `${mod.tag} ${typeName} Cases (${caseData.length}):`,
                description: data,
              })
          );

          const buttons = [
            { emoji: emojis.doubleLeftArrow, style: ButtonStyle.Secondary },
            { emoji: emojis.arrowLeft, style: ButtonStyle.Secondary },
            { emoji: emojis.arrowRight, style: ButtonStyle.Secondary },
            { emoji: emojis.doubleRightArrow, style: ButtonStyle.Secondary },
          ];

          new Pagination()
            .setCommand(interaction)
            .setPages(caseEmbed)
            .setButtons(buttons)
            .setPaginationCollector({ components: "disappear", timeout: 30000, ephemeral: true })
            .setSelectMenu({ enable: false })
            .setFooter({ option: "default" })
            .send();
        } else {
          const caseData = await historySchema.find({ guild_id: `${interaction.guild.id}`, mod_id: `${mod.id}` });

          if (caseData.length < 1) {
            failedOperationEmbed.setDescription(
              [
                `${emojis.cancel} **Unsuccessful Operation!**`,
                `${emojis.space}${emojis.arrowRight} There are no cases for ${mod.tag} in the database.`,
              ].join("\n")
            );
            return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
          }

          let caseString = "";
          let caseStrings = [];

          for (let i = 0; i < caseData.length; i++) {
            caseString += caseString.length < 1 ? "" : "\n ";
            caseString += `${caseData[i].opened === true ? emojis.success : emojis.cancel} \`${
              caseData[i].case_id
            }\` **[${caseData[i].type.toUpperCase()}]** <t:${caseData[i].unix_time}:R>`;

            if (!((i + 1) % 10) || i + 1 === caseData.length) {
              caseStrings.push(caseString);
              caseString = "";
            }
          }

          const caseEmbed = caseStrings.map(
            (data) =>
              new EmbedBuilder({
                title: `${mod.tag} Mod Cases (${caseData.length}):`,
                description: data,
              })
          );

          const buttons = [
            { emoji: emojis.doubleLeftArrow, style: ButtonStyle.Secondary },
            { emoji: emojis.arrowLeft, style: ButtonStyle.Secondary },
            { emoji: emojis.arrowRight, style: ButtonStyle.Secondary },
            { emoji: emojis.doubleRightArrow, style: ButtonStyle.Secondary },
          ];

          new Pagination()
            .setCommand(interaction)
            .setPages(caseEmbed)
            .setButtons(buttons)
            .setPaginationCollector({ components: "disappear", timeout: 30000, ephemeral: true })
            .setSelectMenu({ enable: false })
            .setFooter({ option: "default" })
            .send();
        }
      } else if (caseType && !user && !mod) {
        const caseData = await historySchema.find({ guild_id: `${interaction.guild.id}`, type: caseType });

        if (caseData.length < 1) {
          failedOperationEmbed.setDescription(
            [
              `${emojis.cancel} **Unsuccessful Operation!**`,
              `${emojis.space}${emojis.arrowRight} There are no cases of type \`${typeName}\` in the database.`,
            ].join("\n")
          );
          return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
        }

        let caseString = "";
        let caseStrings = [];

        for (let i = 0; i < caseData.length; i++) {
          caseString += caseString.length < 1 ? "" : "\n ";
          caseString += `${caseData[i].opened === true ? emojis.success : emojis.cancel} \`${
            caseData[i].case_id
          }\` **[${caseData[i].type.toUpperCase()}]** <t:${caseData[i].unix_time}:R>`;

          if (!((i + 1) % 10) || i + 1 === caseData.length) {
            caseStrings.push(caseString);
            caseString = "";
          }
        }

        const caseEmbed = caseStrings.map(
          (data) =>
            new EmbedBuilder({
              title: `${interaction.guild.name} ${typeName} Cases (${caseData.length}):`,
              description: data,
            })
        );

        const buttons = [
          { emoji: emojis.doubleLeftArrow, style: ButtonStyle.Secondary },
          { emoji: emojis.arrowLeft, style: ButtonStyle.Secondary },
          { emoji: emojis.arrowRight, style: ButtonStyle.Secondary },
          { emoji: emojis.doubleRightArrow, style: ButtonStyle.Secondary },
        ];

        new Pagination()
          .setCommand(interaction)
          .setPages(caseEmbed)
          .setButtons(buttons)
          .setPaginationCollector({ components: "disappear", timeout: 30000, ephemeral: true })
          .setSelectMenu({ enable: false })
          .setFooter({ option: "default" })
          .send();
      }
    } else if (interaction.options.getSubcommand() === "modify") {
      const caseID = interaction.options.getInteger("case");
      const reason = interaction.options.getString("reason");
      const state = interaction.options.getBoolean("state");

      const successEmbed = new EmbedBuilder().setColor("Green").setTitle("Case Modified");

      if (!reason && state === null) {
        failedOperationEmbed.setDescription(
          [
            `${emojis.cancel} **Unsuccessful Operation!**`,
            `${emojis.space}${emojis.arrowRight} You need to modify at least the reason or the state`,
          ].join("\n")
        );
        return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
      }

      const caseData = await historySchema.findOne({ case_id: caseID });

      if (caseData === null) {
        failedOperationEmbed.setDescription(
          [
            `${emojis.cancel} **Unsuccessful Operation!**`,
            `${emojis.space}${emojis.arrowRight} No such case was found in the archive!`,
          ].join("\n")
        );
        return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
      } else if (caseData.reason === reason) {
        failedOperationEmbed.setDescription(
          [
            `${emojis.cancel} **Unsuccessful Operation!**`,
            `${emojis.space}${emojis.arrowRight} The new reason matches the old one!`,
          ].join("\n")
        );
        return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
      } else if (caseData.opened === state) {
        failedOperationEmbed.setDescription(
          [
            `${emojis.cancel} **Unsuccessful Operation!**`,
            `${emojis.space}${emojis.arrowRight} The case is already ${state === true ? "active" : "inactive"}!`,
          ].join("\n")
        );
        return await interaction.editReply({ embeds: [failedOperationEmbed], ephemeral: true });
      } else if (reason && state === null) {
        await historySchema.findOneAndUpdate({ case_id: caseID }, { reason: `${reason}` });

        try {
          const message = await modlogsChannel.messages.fetch(`${caseData.msg_id}`);

          await historySchema.findOneAndUpdate({ case_id: caseID }, { edited: true });

          const receivedEmbed = message.embeds[0];
          const newEmbed = EmbedBuilder.from(receivedEmbed).setFields(
            {
              name: `Case:`,
              value: `\`${caseID}\` ${caseData.opened === true ? emojis.success : emojis.cancel}`,
              inline: true,
            },
            { name: `Type:`, value: `\`${caseData.type_name}\``, inline: true },
            {
              name: `Moderator:`,
              value: `\`${caseData.mod_tag}\` ${emojis.moderator}`,
              inline: true,
            },
            { name: `Target:`, value: `${emojis.triangleRight} \`${caseData.user_tag}\` ${emojis.target}` },
            { name: `Reason (Edited):`, value: `${reason}` }
          );

          message.edit({ embeds: [newEmbed] });
        } catch (error) {
          successEmbed.setDescription(
            [
              `Changes have been made!`,
              `**Message Edit:** ${emojis.cancel}`,
              `**Archive Edit:** ${emojis.success}`,
            ].join("\n")
          );
          return await interaction.editReply({ embeds: [successEmbed], ephemeral: true });
        }

        successEmbed.setDescription(
          [
            `Changes have been made!`,
            `**Message Edit:** ${emojis.success}`,
            `**Archive Edit:** ${emojis.success}`,
          ].join("\n")
        );
        return await interaction.editReply({ embeds: [successEmbed], ephemeral: true });
      } else if ((state !== null) & !reason) {
        await historySchema.findOneAndUpdate({ case_id: caseID }, { opened: `${state}` });

        try {
          const message = await modlogsChannel.messages.fetch(`${caseData.msg_id}`);

          const receivedEmbed = message.embeds[0];
          const newEmbed = EmbedBuilder.from(receivedEmbed).setFields(
            {
              name: `Case:`,
              value: `\`${caseID}\` ${state === true ? emojis.success : emojis.cancel}`,
              inline: true,
            },
            { name: `Type:`, value: `\`${caseData.type_name}\``, inline: true },
            {
              name: `Moderator:`,
              value: `\`${caseData.mod_tag}\` ${emojis.moderator}`,
              inline: true,
            },
            { name: `Target:`, value: `${emojis.triangleRight} \`${caseData.user_tag}\` ${emojis.target}` },
            { name: `Reason${caseData.edited ? " (Edited)" : ""}:`, value: `${caseData.reason}` }
          );

          message.edit({ embeds: [newEmbed] });
        } catch (error) {
          successEmbed.setDescription(
            [
              `Changes have been made!`,
              `**Message Edit:** ${emojis.cancel}`,
              `**Archive Edit:** ${emojis.success}`,
            ].join("\n")
          );
          return await interaction.editReply({ embeds: [successEmbed], ephemeral: true });
        }

        successEmbed.setDescription(
          [
            `Changes have been made!`,
            `**Message Edit:** ${emojis.success}`,
            `**Archive Edit:** ${emojis.success}`,
          ].join("\n")
        );
        return await interaction.editReply({ embeds: [successEmbed], ephemeral: true });
      } else if (reason && state !== null) {
        await historySchema.findOneAndUpdate({ case_id: caseID }, { opened: `${state}`, reason: `${reason}` });

        try {
          const message = await modlogsChannel.messages.fetch(`${caseData.msg_id}`);

          await historySchema.findOneAndUpdate({ case_id: caseID }, { edited: true });

          const receivedEmbed = message.embeds[0];
          const newEmbed = EmbedBuilder.from(receivedEmbed).setFields(
            {
              name: `Case:`,
              value: `\`${caseID}\` ${state === true ? emojis.success : emojis.cancel}`,
              inline: true,
            },
            { name: `Type:`, value: `\`${caseData.type_name}\``, inline: true },
            {
              name: `Moderator:`,
              value: `\`${caseData.mod_tag}\` ${emojis.moderator}`,
              inline: true,
            },
            { name: `Target:`, value: `${emojis.triangleRight} \`${caseData.user_tag}\` ${emojis.target}` },
            { name: `Reason (Edited):`, value: `${reason}` }
          );

          message.edit({ embeds: [newEmbed] });
        } catch (error) {
          successEmbed.setDescription(
            [
              `Changes have been made!`,
              `**Message Edit:** ${emojis.cancel}`,
              `**Archive Edit:** ${emojis.success}`,
            ].join("\n")
          );
          return await interaction.editReply({ embeds: [successEmbed], ephemeral: true });
        }

        successEmbed.setDescription(
          [
            `Changes have been made!`,
            `**Message Edit:** ${emojis.success}`,
            `**Archive Edit:** ${emojis.success}`,
          ].join("\n")
        );
        return await interaction.editReply({ embeds: [successEmbed], ephemeral: true });
      }
    }
  },
};
