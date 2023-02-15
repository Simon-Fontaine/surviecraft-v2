const { CommandType, CooldownTypes } = require("wokcommands");
const { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const IDs = require("../../utilities/ids");
const { isStaff } = require("../../utilities/staff-util");
const emojis = require("../../utilities/emojis");

module.exports = {
  description: "Bulk delete messages with the ability to specify",

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
      name: "all",
      description: "Delete any messages in the channel",
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: "count",
          description: "Number of messages to delete",
          minValue: 1,
          maxValue: 100,
          required: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "user",
      description: "Delete messages from a specific user",
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: "count",
          description: "Number of messages to delete",
          minValue: 1,
          maxValue: 100,
          required: true,
        },
        {
          type: ApplicationCommandOptionType.User,
          name: "user",
          description: "The user to delete messages from",
          required: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "bot",
      description: "Delete messages from bots",
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: "count",
          description: "Number of messages to delete",
          minValue: 1,
          maxValue: 100,
          required: true,
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

    let amount = interaction.options.getInteger("count");
    if (amount >= 100) amount = 100;
    if (amount < 1) amount = 1;
    const fetch = await interaction.channel.messages.fetch({ limit: amount });
    const user = interaction.options.getUser("user");

    async function results(deletedMessages) {
      const results = {};
      for (const [, deleted] of deletedMessages) {
        const user = `${deleted.author.username}#${deleted.author.discriminator} [\`${deleted.author.id}\`]`;
        if (!results[user]) results[user] = 0;
        results[user]++;
      }

      const userMessageMap = Object.entries(results);

      const finalResult = `${deletedMessages.size} message${
        deletedMessages.size > 1 ? "s" : ""
      } have been deleted!\n\n${userMessageMap
        .map(([user, messages]) => `${messages} : ${emojis.success} ${user}`)
        .join("\n")}`;

      if (deletedMessages.size <= 0) {
        await interaction.editReply({
          content: `${finalResult}`,
          ephemeral: true,
        });
      }

      const logChannel = interaction.guild.channels.cache.get(IDs.LOGS_CHANNEL);
      const deletedLog = deletedMessages
        .map(
          (msg) =>
            `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}\n=> ${msg.content}${
              msg.attachments.size
                ? `\n[${msg.createdAt.toLocaleString()}] ${msg.author.tag}\n=> ${msg.attachments.first().url}`
                : ""
            }`
        )
        .join("\n");

      let file;
      if (deletedMessages.size >= 1) {
        file = [
          {
            attachment: Buffer.from(deletedLog),
            name: "deletedMessages.txt",
          },
        ];
      }

      const messageResultEmbed = new EmbedBuilder()
        .setColor("#2f3136")
        .setTitle("Bulk Delete Result:")
        .setDescription(
          [
            `${emojis.channel} **Channel:** ${interaction.channel}`,
            `${emojis.moderator} **Moderator:** ${interaction.user}`,
            `${emojis.target} **Details:**`,
            `${emojis.space}${emojis.doubleRightArrow} Purge Request: \`${amount}\``,
            `${emojis.space}${emojis.doubleRightArrow} Messages Purged: \`${deletedMessages.size}\``,
            `${emojis.space}${emojis.doubleRightArrow} Type: \`${interaction.options.getSubcommand()}\``,
            ``,
            `**Affected User:**`,
            `${userMessageMap
              .map(([user, messages]) => `${emojis.space}${messages} : ${emojis.success} ${user}`)
              .join("\n")}`,
          ].join("\n")
        );

      if (file === undefined) {
        await logChannel.send({
          content: `${`**Messages:**\n${deletedLog}`}`,
          embeds: [messageResultEmbed],
        });
      } else {
        await logChannel.send({ files: file, embeds: [messageResultEmbed] });
      }

      await interaction.editReply({
        content: `${finalResult}`,
        ephemeral: true,
      });
    }

    let filtered;
    let deletedMessages;

    switch (interaction.options.getSubcommand()) {
      case "all":
        deletedMessages = await interaction.channel.bulkDelete(fetch, true);
        results(deletedMessages);
        break;

      case "bot":
        filtered = fetch.filter((m) => m.author.bot);
        deletedMessages = await interaction.channel.bulkDelete(filtered, true);
        results(deletedMessages);

        break;
      case "user":
        filtered = fetch.filter((m) => m.author.id === user.id);
        deletedMessages = await interaction.channel.bulkDelete(filtered, true);
        results(deletedMessages);
    }
  },
};
