const { CommandType, CooldownTypes } = require("wokcommands");
const { ApplicationCommandOptionType } = require("discord.js");
const IDs = require("../../utilities/ids");

const options = ["ip", "wiki", "invitations", "regles-ig", "regles-ds", "boost", "aide"];

module.exports = {
  description: "Donne des informations utiles sur le serveur!",

  type: CommandType.SLASH,
  testOnly: true,
  guildOnly: true,

  cooldowns: {
    type: CooldownTypes.perUser,
    duration: "3 s",
  },

  options: [
    {
      name: "options",
      description: "Quelles informations voulez-vous obtenir ?",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
  ],

  autocomplete: (command, argument, interaction) => {
    return options;
  },

  callback: async ({ interaction, text }) => {
    await interaction.deferReply({ ephemeral: true });

    if (!options.includes(text)) {
      return interaction.editReply({ content: "Aucune rubrique à ce sujet !", ephemeral: true });
    }

    let resultText;

    switch (text) {
      case "ip":
        resultText = "IP: **play.surviecraft.fr**\nVersion: **1.18.2**";
        break;
      case "wiki":
        resultText = "Wiki: https://surviecraft.fr/wiki";
        break;
      case "invitations":
        resultText = "Invitations: https://discord.com/invite/7Js6rjy";
        break;
      case "regles-ig":
        resultText = "Règles: https://surviecraft.fr/regles-ig";
        break;
      case "regles-ds":
        resultText = `Règles: <#${IDs.RULES_CHANNEL}>`;
        break;
      case "boost":
        resultText =
          "Start-Nitro: Accéder au serveur de votre choix, et cliquez sur la flèche en face du nom de serveur, et sur Nitro Server Boost. Une fenêtre apparaîtra pour afficher les avantages actuels et confirmer votre Boost pour ce serveur ! Cliquez sur “Boost de serveur”, et voilà le serveur est boosté !";
        break;
      case "aide":
        resultText = `Aide: Créez un demande d'aide (ticket) en visitant le salon <#${IDs.TICKET_JOUEUR_CHANNEL}>`;
        break;
    }

    interaction.editReply({ content: resultText, ephemeral: true });
  },
};
