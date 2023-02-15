const { ApplicationCommandOptionType } = require("discord.js");
const { CommandType, CooldownTypes } = require("wokcommands");
const deepl = require("deepl-node");
const { isStaff } = require("../../utilities/staff-util");

module.exports = {
  description: "Traduit dune langue à une autre.",

  type: CommandType.SLASH,
  testOnly: true,
  guildOnly: false,

  delete: false,

  options: [
    {
      name: "from",
      description: "La langue depuis laquelle traduire le texte.",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
    {
      name: "to",
      description: "La langue vers laquelle traduire le texte.",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
    {
      name: "text",
      description: "Le texte à traduire.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  cooldowns: {
    type: CooldownTypes.global,
    duration: "90 s",
  },

  autocomplete: (command, argument, interaction) => {
    return ["French", "English US", "English GB", "Dutch", "German", "Italian", "Spanish"];
  },

  callback: async ({ interaction, member }) => {
    await interaction.deferReply({ ephemeral: true });

    if (!isStaff(member)) {
      return interaction.editReply({
        content: "Err: Vous n'avez pas la permission d'utiliser cette commande !",
        ephemeral: true,
      });
    }

    function toLanguage(language) {
      switch (language) {
        case "French":
          return "fr";
        case "English US":
          return "en-US";
        case "English GB":
          return "en-GB";
        case "Dutch":
          return "nl";
        case "German":
          return "de";
        case "Italian":
          return "it";
        case "Spanish":
          return "es";
        default:
          return language;
      }
    }

    function fromLanguage(language) {
      switch (language) {
        case "French":
          return "fr";
        case "English US":
          return "en";
        case "English GB":
          return "en";
        case "Dutch":
          return "nl";
        case "German":
          return "de";
        case "Italian":
          return "it";
        case "Spanish":
          return "es";
        default:
          return language;
      }
    }

    const from = interaction.options.getString("from");
    const to = interaction.options.getString("to");
    const text = interaction.options.getString("text");

    console.log(`[TRANSLATE] ${interaction.user.tag} asked: ${text} (${from} to ${to})`);

    if (from === to) {
      return await interaction.editReply({
        content: "Vous devez choisir deux langues différentes.",
        ephemeral: true,
      });
    }

    const translator = new deepl.Translator(process.env.DEEPL_API_KEY);

    translator
      .translateText(text, fromLanguage(from), toLanguage(to))
      .then(async (result) => {
        return await interaction.editReply({
          content: result.text,
          ephemeral: true,
        });
      })
      .catch(async (error) => {
        return await interaction.editReply({
          content: `\`\`\`${error}\`\`\``,
          ephemeral: true,
        });
      });
  },
};
