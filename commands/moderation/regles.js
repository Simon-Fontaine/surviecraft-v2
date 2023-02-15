const { CommandType, CooldownTypes } = require("wokcommands");
const { ApplicationCommandOptionType } = require("discord.js");
const { isStaff } = require("../../utilities/staff-util");
const IDs = require("../../utilities/ids");

const getRule = (ruleNumber) => {
  let rule = "";

  switch (ruleNumber) {
    case 1:
      rule = [
        "1) Votre compte Discord est personnel. Vous serez tenu pour responsable de toute infraction au règlement commise via votre compte Discord.",
      ].join("\n");
      break;

    case 2:
      rule = [
        "2) Le pseudonyme que vous utilisez sur le serveur doit être correct et ne pas contenir de propos offensants, irrespectueux, pornographiques, racistes, politiques, discriminatoires, illégaux ou choquants. Il en va de même pour vos avatars et phrases personnalisées.",
      ].join("\n");
      break;

    case 3:
      rule = [
        "3) Les propos irrespectueux, insultants, discriminatoires, offensants, à teneur pornographique, raciste ou politique ainsi que le harcèlement, les menaces, l'agressivité, le manque de respect, les attaques personnelles ou tout autre comportement visant à nuire à un membre entraînera une perte d'accès au serveur. Dans certaines situations extrêmes ou problématiques, les utilisateurs peuvent recevoir des sanctions temporaires ou permanentes sans avertissement préalable.",
      ].join("\n");
      break;

    case 4:
      rule = [
        "4) Les principaux canaux disposent d'informations complémentaires dans la section \"Description\". Veuillez en prendre connaissance afin d'utiliser les salons appropriés.",
        "",
        "Dans les canaux vocaux, le spam auditif, le changement répétitif de canal, les soundboards et modifications de voix sont interdits.",
      ].join("\n");
      break;

    case 5:
      rule = [
        "5) Les contenus pornographiques / NSFW (Not Safe for Work) sont interdits sur l'ensemble du serveur.",
      ].join("\n");
      break;

    case 6:
      rule = [
        `6) La publicité et les liens externes Discord sont interdits, sauf autorisation explicite d'un <@&${IDs.RESP_ROLE}> ou <@&${IDs.ADMIN_ROLE}>. Les contenus personnels sont autorisés dans le salon <#${IDs.IMAGES_VIDEO_CHANNEL}>.`,
        "",
        `Les invitations Discord et les liens malveillants sont automatiquement supprimés par le bot, certaines images peuvent ne pas être publiées automatiquement (en raison de la protection par défaut du serveur). Pour toutes les demandes de publicité ou partenariat veuillez créer un ticket dans <#${IDs.TICKET_JOUEUR_CHANNEL}>.`,
      ].join("\n");
      break;

    case 7:
      rule = [
        `7) L'équipe de <@&${IDs.STAFF_ROLE}> donnera des avertissements à tous les membres qui ne respectent pas les règles. Selon la gravité de l'infraction, les <@&${IDs.GUIDE_ROLE}>, <@&${IDs.MODERATOR_ROLE}> et <@&${IDs.SUPERMODO_ROLE}> se réservent le droit de sanctionner votre compte sans préavis.`,
      ].join("\n");
      break;
  }

  return rule;
};

module.exports = {
  description: "Affiche la règle demandée",

  type: CommandType.SLASH,
  testOnly: true,
  guildOnly: true,

  cooldowns: {
    type: CooldownTypes.perUser,
    duration: "3 s",
  },

  options: [
    {
      name: "numéro-règle",
      description: "Quelles numéro de règle voulez-vous obtenir ?",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
  ],

  callback: async ({ interaction, member, channel, text }) => {
    await interaction.deferReply({ ephemeral: true });

    if (!isStaff(member)) {
      return interaction.editReply({
        content: `Vous n'avez pas la permission d'utiliser cette commande !\nUtilisez la commande </info:1066359680986796042> ou visitez <#${IDs.RULES_CHANNEL}>.`,
      });
    }

    const rule = getRule(parseInt(text));

    if (!rule) {
      return interaction.editReply({
        content: "Le numéro de la règle doit être compris entre 1 et 7 !",
        ephemeral: true,
      });
    }

    interaction.editReply({ content: "Done !", ephemeral: true });
    channel.send({
      content: `Règle ${rule}`,
      allowedMentions: {
        parse: [],
      },
    });
  },
};
