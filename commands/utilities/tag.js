const { CommandType, CooldownTypes } = require("wokcommands");
const { ApplicationCommandOptionType, EmbedBuilder, ButtonStyle } = require("discord.js");
const { isHighStaff } = require("../../utilities/staff-util");
const { addTag, removeTag } = require("../../features/tags");
const emojis = require("../../utilities/emojis");
const Pagination = require("customizable-discordjs-pagination");
const tagSchema = require("../../models/tag-schema");

const validActions = ["create", "delete", "keyword"];
const validEditActions = `/tagedit "${validActions
  .filter((tag) => tag !== "delete")
  .toString()
  .replace(",", '" ou "')}"!`;

module.exports = {
  description: "Manage your server's tags",

  type: CommandType.SLASH,
  testOnly: true,
  guildOnly: true,

  cooldowns: {
    type: CooldownTypes.perUser,
    duration: "3 s",
  },

  delete: false,

  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "send",
      description: "Send the tag message in chat",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "tag",
          description: "The name of the tag",
          required: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "info",
      description: "Get information about a tag",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "tag",
          description: "The name of the tag",
          required: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "list",
      description: "List all tags",
    },

    {
      type: ApplicationCommandOptionType.Subcommand,
      name: "edit",
      description: "Delete, create or edit a tag",
      options: [
        {
          name: "action",
          description: "Quelle action effectuer",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "create", value: "create" },
            { name: "delete", value: "delete" },
            { name: "keyword", value: "keyword" },
          ],
        },
        {
          name: "tag",
          type: ApplicationCommandOptionType.String,
          description: "Le nom du tag",
          required: true,
        },
        {
          name: "text",
          type: ApplicationCommandOptionType.String,
          description: "Une réponse simple pour ce tag",
          required: false,
        },
      ],
    },
  ],

  callback: async ({ interaction, channel, member }) => {
    const subcommand = interaction.options.getSubcommand();
    const tagName = interaction.options.getString("tag");

    switch (subcommand) {
      case "edit":
        await interaction.deferReply({ ephemeral: true });

        if (!isHighStaff(member)) {
          return interaction.editReply({
            content: "Err: Vous n'avez pas la permission d'utiliser cette commande !",
            ephemeral: true,
          });
        }

        const action = interaction.options.getString("action");
        const name = interaction.options.getString("tag");
        let text = interaction.options.getString("text");

        const tagNotExist = `Ce tag n'existe pas ! Pour le créer, exécutez \`/tagedit create ${name} <message>\``;

        if (action === "delete") {
          const results = await tagSchema.findOne({ _id: name });

          if (!results)
            return interaction.editReply({
              content: tagNotExist,
              allowedMentions: {
                parse: [],
              },
              ephemeral: true,
            });

          await tagSchema.findOneAndDelete({ _id: name });
          removeTag(name);

          return interaction.editReply({
            content: `Tag "${name}" a été supprimé!`,
            allowedMentions: {
              parse: [],
            },
            ephemeral: true,
          });
        }

        if (action === "keyword") {
          if (!text)
            return interaction.editReply({
              content: `Veuillez fournir un message pour le tag lorsque vous utilisez "${validEditActions}"`,
              allowedMentions: {
                parse: [],
              },
              ephemeral: true,
            });

          text = text.toLowerCase();

          const results = await tagSchema.findOneAndUpdate(
            { _id: name },
            { $addToSet: { keywords: text } },
            { new: true }
          );

          if (results) {
            addTag(name, results.message, results.keywords);
            return interaction.editReply({
              content: `Mot clé "${text}" ajouté au tag "${name}"`,
              allowedMentions: {
                parse: [],
              },
              ephemeral: true,
            });
          }

          return interaction.editReply({
            content: tagNotExist,
            allowedMentions: {
              parse: [],
            },
            ephemeral: true,
          });
        }

        if (action === "create") {
          let askMessage;
          if (!text) {
            try {
              askMessage = await interaction.editReply({
                content: "Veuillez entrer le message pour ce tag : (Vous avez 45 secondes)",
                ephemeral: true,
                fetchReply: true,
              });
              text = await getTagText(interaction);
            } catch (err) {
              console.log(err);
              return interaction.editReply({
                content: "Je n'ai pas reçu de texte valide !",
                allowedMentions: {
                  parse: [],
                },
                ephemeral: true,
              });
            }
          }

          await tagSchema.findOneAndUpdate({ _id: name }, { message: text }, { upsert: true });

          addTag(name, text, []);

          const createdResponse = `Tag "${name}" créé avec comme message "${text}"`;

          if (askMessage)
            await interaction.editReply({
              content: createdResponse,
              allowedMentions: {
                parse: [],
              },
              ephemeral: true,
            });
          else
            return interaction.editReply({
              content: createdResponse,
              allowedMentions: {
                parse: [],
              },
              ephemeral: true,
            });
        }

        async function getTagText(interaction) {
          const filter = (msg) => msg.author.id === interaction.member.id;

          const collectedMessage = await interaction.channel.awaitMessages({
            filter,
            max: 1,
            time: 45 * 1000,
            errors: ["time"],
          });

          const text = collectedMessage.first();

          if (text) {
            await text.delete().catch(() => ({}));
          }

          if (!text.content) throw "Aucun message recueilli";

          return text.content;
        }

        break;
      case "send":
        await interaction.deferReply({ ephemeral: true });

        const foundTag = await tagSchema.findById(tagName.toLowerCase());
        if (!foundTag) {
          return interaction.editReply({
            content: `Ce tag n'existe pas ! Pour voir tous les tags, tapez \`/taglist\``,
            ephemeral: true,
            allowedMentions: {
              parse: [],
            },
          });
        }

        channel.send(foundTag.message);

        if (interaction) {
          interaction.editReply({
            ephemeral: true,
            content: "Message evoyé!",
          });
        }
        break;
      case "info":
        await interaction.deferReply({ ephemeral: true });

        try {
          const tag = await tagSchema.findById(tagName.toLowerCase());

          if (!tag)
            return interaction.editReply({
              ephemeral: true,
              content: "Tag non trouvé avec cet ID",
            });

          const keywords = tag.keywords.map((k) => `> • ${k}`).join("\n");

          const embed = new EmbedBuilder()
            .setTitle(`Tag: ${tag._id.replace(/(?:^|\s)\S/g, (a) => a.toUpperCase())}`)
            .setDescription(`**Message**\n ${tag.message.trim() ? tag.message : "Aucun"}`)
            .addFields({ name: "Mots clés", value: keywords || "Aucun" })
            .setColor("Purple");
          return interaction.editReply({
            embeds: [embed],
            allowedMentions: {
              parse: [],
            },
          });
        } catch (err) {
          console.log("Error - taginfo", err.message || err);

          await interaction.editReply({
            content: "Désolé, j'ai rencontré un problème, veuillez réessayer !",
            ephemeral: true,
          });
        }
        break;
      case "list":
        await interaction.deferReply({ ephemeral: true });

        try {
          const tags = await tagSchema.find();

          if (!tags.length) {
            await interaction.editReply({ content: "Aucun tags n'existe !" });
            return;
          }

          let tagString = "";
          let tagStrings = [];

          for (let i = 0; i < tags.length; i++) {
            const { _id, keywords } = tags[i];
            const tagIndex = tags.findIndex((t) => t._id === _id) + 1;
            tagString += tagString.length < 1 ? "" : "\n\n ";
            tagString += `**${tagIndex})** ${_id.replace(/(?:^|\s)\S/g, (a) => a.toUpperCase())}`;
            tagString += `\n\n> Keywords:\n> • ${keywords.length ? keywords.join("\n> • ") : "None"}`;

            if (!((i + 1) % 10) || i + 1 === tags.length) {
              tagStrings.push(tagString);
              tagString = "";
            }
          }

          const tagEmbeds = tagStrings.map((t) =>
            new EmbedBuilder().setTitle("Tags disponibles").setDescription(t).setColor("Blue")
          );

          const buttons = [
            { emoji: emojis.doubleLeftArrow, style: ButtonStyle.Secondary },
            { emoji: emojis.arrowLeft, style: ButtonStyle.Secondary },
            { emoji: emojis.arrowRight, style: ButtonStyle.Secondary },
            { emoji: emojis.doubleRightArrow, style: ButtonStyle.Secondary },
          ];

          new Pagination()
            .setCommand(interaction)
            .setPages(tagEmbeds)
            .setButtons(buttons)
            .setPaginationCollector({ components: "disappear", timeout: 30000, ephemeral: true })
            .setSelectMenu({ enable: false })
            .setFooter({ option: "default" })
            .send();
        } catch (err) {
          console.log("Error - taglist", err.message || err);

          await interaction.editReply({
            content: "J'ai rencontré un problème, veuillez réessayer.",
            ephemeral: true,
          });
        }
        break;
    }
  },
};
