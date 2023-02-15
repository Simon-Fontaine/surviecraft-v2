const reglesMessageSchema = require("../models/message-regles-schema");
const { ActionRowBuilder, ButtonBuilder, Events, EmbedBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");
const IDs = require("../utilities/ids");

module.exports = async (instance, client) => {
  const guild = client.guilds.cache.get(IDs.GUILD);
  const channel = guild.channels.cache.get(IDs.RULES_CHANNEL);

  let results = await reglesMessageSchema.findById(guild.id);

  const embed = new EmbedBuilder()
    .setTitle(`Bienvenue sur le serveur ${guild.name} !`)
    .setColor("#ffea00")
    .setDescription(
      [
        "Vous reconnaissez avoir pris connaissance, accepté et vous vous engagez à respecter :",
        "",
        `🔸 le <#${IDs.RULES_CHANNEL}> « ${guild.name} »,`,
        "",
        "🔸 les [Conditions Générales d'Utilisations](https://discord.com/terms) (CGU) du fournisseur du serveur Discord Inc.",
        "",
        "Vous êtes suffisamment avisés pour savoir si vos actes sont corrects ou non. Si une règle ne figure pas dans le règlement, cela ne vous autorise pas à l'enfreindre ou en abuser.",
        "",
        "Nous nous réservons le droit de retirer l'accès au serveur aux utilisateurs qui portent préjudice à ce dernier ou à sa communauté.",
      ].join("\n")
    );
  const embed1 = new EmbedBuilder()
    .setTitle("1 – VOTRE COMPTE EST SOUS VOTRE RESPONSABILITÉ")
    .setColor("#ffea00")
    .setDescription(
      [
        "Votre compte Discord est personnel. Vous serez tenu pour responsable de toute infraction au règlement commise via votre compte Discord.",
      ].join("\n")
    );
  const embed2 = new EmbedBuilder()
    .setTitle("2 – PSEUDONYME & AVATAR")
    .setColor("#ffea00")
    .setDescription(
      [
        "Le pseudonyme que vous utilisez sur le serveur doit être correct et ne pas contenir de propos offensants, irrespectueux, pornographiques, racistes, politiques, discriminatoires, illégaux ou choquants. Il en va de même pour vos avatars et phrases personnalisées.",
      ].join("\n")
    );
  const embed3 = new EmbedBuilder()
    .setTitle("3 – COMPORTEMENT")
    .setColor("#ffea00")
    .setDescription(
      [
        "Les propos irrespectueux, insultants, discriminatoires, offensants, à teneur pornographique, raciste ou politique ainsi que le harcèlement, les menaces, l'agressivité, le manque de respect, les attaques personnelles ou tout autre comportement visant à nuire à un membre entraînera une perte d'accès au serveur. Dans certaines situations extrêmes ou problématiques, les utilisateurs peuvent recevoir des sanctions temporaires ou permanentes sans avertissement préalable.",
      ].join("\n")
    );
  const embed4 = new EmbedBuilder()
    .setTitle("4 – UTILISATION DES CANAUX")
    .setColor("#ffea00")
    .setDescription(
      [
        "Les principaux canaux disposent d'informations complémentaires dans la section \"Description\". Veuillez en prendre connaissance afin d'utiliser les salons appropriés.",
        "",
        "Dans les canaux vocaux, le spam auditif, le changement répétitif de canal, les soundboards et modifications de voix sont interdits.",
      ].join("\n")
    );
  const embed5 = new EmbedBuilder()
    .setTitle("5 – NSFW")
    .setColor("#ffea00")
    .setDescription(
      ["Les contenus pornographiques / NSFW (Not Safe for Work) sont interdits sur l'ensemble du serveur."].join("\n")
    );
  const embed6 = new EmbedBuilder()
    .setTitle("6 – PUBLICITÉ")
    .setColor("#ffea00")
    .setDescription(
      [
        `La publicité et les liens externes Discord sont interdits, sauf autorisation explicite d'un <@&${IDs.RESP_ROLE}> ou <@&${IDs.ADMIN_ROLE}>. Les contenus personnels sont autorisés dans le salon <#${IDs.IMAGES_VIDEO_CHANNEL}>.`,
        "",
        `Les invitations Discord et les liens malveillants sont automatiquement supprimés par le bot, certaines images peuvent ne pas être publiées automatiquement (en raison de la protection par défaut du serveur). Pour toutes les demandes de publicité ou partenariat veuillez créer un ticket dans <#${IDs.TICKET_CHANNEL}>.`,
      ].join("\n")
    );
  const embed7 = new EmbedBuilder()
    .setTitle("7 – POLITIQUE DE MODÉRATION")
    .setColor("#ffea00")
    .setDescription(
      [
        `L'équipe de <@&${IDs.STAFF_ROLE}> donnera des avertissements à tous les membres qui ne respectent pas les règles. Selon la gravité de l'infraction, les <@&${IDs.GUIDE_ROLE}>, <@&${IDs.MODERATOR_ROLE}> et <@&${IDs.SUPERMODO_ROLE}> se réservent le droit de sanctionner votre compte sans préavis.`,
      ].join("\n")
    );
  const embed8 = new EmbedBuilder()
    .setColor("#ffea00")
    .setDescription(
      [
        "Ces règles seront appliquées à l'ensemble du serveur. Cela inclut, sans s'y limiter : les messages, threads, profils, avatars, pseudonymes, statuts et pièces jointes. L'interprétation et l'application correcte de ces règles dépendront de l'équipe de modération.",
        "",
        "Les sanctions prises sur le serveur Discord peuvent être transférées sur d'autres plateformes et communautés SurvieCraft. De la même manière, les sanctions reçues sur les pages de réseaux sociaux et sur d'autres communautés SurvieCraft peuvent être appliquées sur le serveur Discord.",
        "",
        "Le règlement est considéré comme lu et approuvé à partir du moment où un membre a rejoint le serveur Discord.",
        "",
        "Le présent règlement est susceptible d'être modifié ultérieurement.",
      ].join("\n")
    );

  const rows = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Règlement En Ligne")
      .setURL("https://surviecraft.fr/regles-ig")
      .setStyle(ButtonStyle.Link),
    new ButtonBuilder()
      .setLabel("Conditions Générales d'Utilisation de Discord")
      .setURL("https://discord.com/terms")
      .setStyle(ButtonStyle.Link)
  );

  if (results) {
    const message = await channel.messages
      .fetch(results.messageId, {
        cache: true,
        force: true,
      })
      .catch(() => {});

    if (message) {
      message.edit({
        embeds: [embed, embed1, embed2, embed3, embed4, embed5, embed6, embed7, embed8],
        components: [rows],
      });
    } else {
      results = null;
    }
  }

  if (!results) {
    const message = await channel.send({
      embeds: [embed, embed1, embed2, embed3, embed4, embed5, embed6, embed7, embed8],
      components: [rows],
    });

    await reglesMessageSchema.findOneAndUpdate(
      {
        _id: guild.id,
      },
      {
        _id: guild.id,
        messageId: message.id,
      },
      {
        upsert: true,
      }
    );
  }
};
