const { CommandType, CooldownTypes } = require("wokcommands");
const { ApplicationCommandOptionType, AttachmentBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const IDs = require("../../utilities/ids");
const { isHighStaff } = require("../../utilities/staff-util");

module.exports = {
  description: "Envoie le message des résultats des votes dans la sallon annonces",

  type: CommandType.SLASH,
  testOnly: true,
  guildOnly: true,

  delete: false,

  cooldowns: {
    type: CooldownTypes.perUser,
    duration: "5 s",
  },

  options: [
    {
      name: "1er-gagnant",
      description: "Le premier des tops vote.",
      required: true,
      type: ApplicationCommandOptionType.User,
    },
    {
      name: "2eme-gagnant",
      description: "Le deuxième des tops vote.",
      required: true,
      type: ApplicationCommandOptionType.User,
    },
    {
      name: "3eme-gagnant",
      description: "Le troisième des tops vote.",
      required: true,
      type: ApplicationCommandOptionType.User,
    },
    {
      name: "1er-prix",
      description: "Le montant du premier prix.",
      required: true,
      minValue: 0,
      type: ApplicationCommandOptionType.Integer,
    },
    {
      name: "2eme-prix",
      description: "Le montant du deuxième prix.",
      required: true,
      minValue: 0,
      type: ApplicationCommandOptionType.Integer,
    },
    {
      name: "3eme-prix",
      description: "Le montant du troisième prix.",
      required: true,
      minValue: 0,
      type: ApplicationCommandOptionType.Integer,
    },
    {
      name: "1er-nombre-votes",
      description: "Le nombre de vote du premier.",
      required: true,
      minValue: 0,
      type: ApplicationCommandOptionType.Integer,
    },
    {
      name: "2eme-nombre-votes",
      description: "Le nombre de vote du deuxième.",
      required: true,
      minValue: 0,
      type: ApplicationCommandOptionType.Integer,
    },
    {
      name: "3eme-nombre-votes",
      description: "Le nombre de vote du troisième.",
      required: true,
      minValue: 0,
      type: ApplicationCommandOptionType.Integer,
    },
  ],

  callback: async ({ interaction, guild }) => {
    await interaction.deferReply({ ephemeral: true });

    if (!isHighStaff(interaction.member)) {
      return interaction.editReply({
        content: "Err: Vous n'avez pas la permission d'utiliser cette commande !",
        ephemeral: true,
      });
    }

    interaction.editReply({
      content: `Votre annonce va être envoyée dans <#${IDs.ANNOUNCEMENT_CHANNEL}>`,
      ephemeral: true,
    });

    const premierGagnant = interaction.options.getMember("1er-gagnant");
    const deuxièmeGagnant = interaction.options.getMember("2eme-gagnant");
    const troisièmeGagnant = interaction.options.getMember("3eme-gagnant");
    const premierPrix = interaction.options.getInteger("1er-prix");
    const deuxièmePrix = interaction.options.getInteger("2eme-prix");
    const troisièmePrix = interaction.options.getInteger("3eme-prix");
    const premierNombresVotes = interaction.options.getInteger("1er-nombre-votes");
    const deuxièmeNombresVotes = interaction.options.getInteger("2eme-nombre-votes");
    const troisièmeNombresVotes = interaction.options.getInteger("3eme-nombre-votes");

    const ANNOUNCEMENT_CHANNEL = guild.channels.cache.get(IDs.ANNOUNCEMENT_CHANNEL);

    if (!ANNOUNCEMENT_CHANNEL) {
      return interaction.editReply({
        content: "Err: Aucuns salons d'annonces trouvé !",
        ephemeral: true,
      });
    }

    const oldRole = await guild.roles.cache.find((role) => role.name == "| Top Voteurs");
    if (!oldRole) {
      return interaction.editReply({
        content: "Err: Aucuns rôle trouvé !",
        ephemeral: true,
      });
    }

    await guild.roles.delete(oldRole.id, "Suppression du rôle Top Voteurs").catch(() => {
      return interaction.editReply({
        content: "Err: Problème survenu lors de la suppression du rôle !",
        ephemeral: true,
      });
    });

    const newRole = await guild.roles
      .create({
        name: oldRole.name,
        color: oldRole.color,
        hoist: oldRole.hoist,
        position: oldRole.position,
        permissions: oldRole.permissions,
        mentionable: oldRole.mentionable,
        reason: "Création du rôle Top Voteurs",
      })
      .catch(() => {
        return interaction.editReply({
          content: "Err: Problème survenu lors de la création du rôle !",
          ephemeral: true,
        });
      });

    const members = [];
    members.push(premierGagnant, deuxièmeGagnant, troisièmeGagnant);

    for (let i = 0; i < members.length; i++) {
      members[i].roles.add(newRole).catch(() => {});
    }

    const images = [
      "C:/Users/simon/SynologyDrive/Drive/Desktop/surviecraftFinal/images/celebration-1.gif",
      "C:/Users/simon/SynologyDrive/Drive/Desktop/surviecraftFinal/images/celebration-2.gif",
      "C:/Users/simon/SynologyDrive/Drive/Desktop/surviecraftFinal/images/celebration-3.gif",
      "C:/Users/simon/SynologyDrive/Drive/Desktop/surviecraftFinal/images/celebration-4.gif",
    ];

    const image = images[Math.floor(Math.random() * images.length)];
    const attachment = new AttachmentBuilder(image, { name: "celebration.gif" });

    const content = [
      `🏆 **Annonce ${newRole} de ce mois-ci :**`,
      ``,
      `**Top** 1️⃣ ${premierGagnant} avec ${premierNombresVotes} votes (${premierPrix}€ boutique)`,
      `**Top** 2️⃣ ${deuxièmeGagnant} avec ${deuxièmeNombresVotes} votes (${deuxièmePrix}€ boutique)`,
      `**Top** 3️⃣ ${troisièmeGagnant} avec ${troisièmeNombresVotes} votes (${troisièmePrix}€ boutique)`,
      ``,
      `> __Félicitations__ à eux ! Les votes sont maintenant réinitialisés.`,
      ``,
      `<@&${IDs.ALL_NOTIFICATIONS_ROLE}>`,
    ].join("\n");

    ANNOUNCEMENT_CHANNEL.send({
      content: content,
      files: [attachment],
    }).then(() => {
      interaction.editReply({
        content: `**Done !**`,
        ephemeral: true,
      });
    });
  },
};
