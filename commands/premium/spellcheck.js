const { ApplicationCommandOptionType } = require("discord.js");
const { CommandType, CooldownTypes } = require("wokcommands");
const { Configuration, OpenAIApi } = require("openai");
const { isStaff } = require("../../utilities/staff-util");

module.exports = {
  description: "Corrige l'orthographe d'un texte.",

  type: CommandType.SLASH,
  testOnly: true,
  guildOnly: false,

  delete: false,

  options: [
    {
      name: "langue",
      description: "La langue à utiliser pour la correction orthographique.",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
    {
      name: "text",
      description: "Le texte à corriger.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  cooldowns: {
    type: CooldownTypes.global,
    duration: "90 s",
  },

  autocomplete: (command, argument, interaction) => {
    return ["French", "English", "Dutch", "German", "Italian", "Spanish"];
  },

  callback: async ({ interaction, member }) => {
    await interaction.deferReply({ ephemeral: true });

    if (!isStaff(member)) {
      return interaction.editReply({
        content: "Err: Vous n'avez pas la permission d'utiliser cette commande !",
        ephemeral: true,
      });
    }

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const openai = new OpenAIApi(configuration);

    const language = interaction.options.getString("langue");
    const text = interaction.options.getString("text");

    console.log(`[SPELLCHECK] ${interaction.user.tag} asked: ${text} (${language})`);

    try {
      const edit = await openai.createEdit({
        model: "text-davinci-edit-001",
        input: text,
        instruction: `Fix the grammar and spelling mistake in this text in ${language}`,
        temperature: 0,
        top_p: 1.0,
      });
      return await interaction.editReply({
        content: edit.data.choices[0].text,
        ephemeral: true,
      });
    } catch (error) {
      if (error.response) {
        return await interaction.editReply({
          content: error.response.status + " | " + error.response.data,
          ephemeral: true,
        });
      } else {
        return await interaction.editReply({
          content: error.message,
          ephemeral: true,
        });
      }
    }
  },
};
