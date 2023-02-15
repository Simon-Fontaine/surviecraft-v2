const { CommandType, CooldownTypes } = require("wokcommands");
const { ApplicationCommandOptionType, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const IDs = require("../../utilities/ids");
const { isHighStaff } = require("../../utilities/staff-util");

module.exports = {
  description: "Envoie le message des codes promos dans la sallon annonces",

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
      type: ApplicationCommandOptionType.Integer,
      name: "montant-reduction",
      description: "Le montant de la réduction en cours",
      minValue: 0,
      maxValue: 100,
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "code-promo",
      description: "Le code de la promotion",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: "jour-mois",
      description: "Jusqu'à quand la réduction est valable",
      required: true,
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

    const MONTANT_REDUCTION = interaction.options.getInteger("montant-reduction");
    const CODE_PROMO = interaction.options.getString("code-promo");
    const JOUR_MOIS = interaction.options.getString("jour-mois");

    const ANNOUNCEMENT_CHANNEL = guild.channels.cache.get(IDs.ANNOUNCEMENT_CHANNEL);

    if (!ANNOUNCEMENT_CHANNEL) {
      return interaction.editReply({
        content: "Err: Aucuns salons d'annonces trouvé !",
        ephemeral: true,
      });
    }

    const SC_EMOJIS = guild.emojis.cache.find((emoji) => emoji.name === "SC");

    if (!SC_EMOJIS) {
      return interaction.editReply({
        content: "Err: Aucuns emojis SC trouvé !",
        ephemeral: true,
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Boutique")
        .setEmoji("🛒")
        .setStyle(ButtonStyle.Link)
        .setURL("https://surviecraft.fr/shop/categories/grades")
    );

    const content = [
      `💯 **Annonce PROMOTION** 💯`,
      ``,
      `Profitez d'une promotion de **-${MONTANT_REDUCTION}%** jusqu'au \`${JOUR_MOIS}\`.`,
      ``,
      `**CODE :** \`${CODE_PROMO}\``,
      ``,
      `> Bon jeu sur **S**urvie**C**raft @everyone !`,
      `Cordialement le Staff ${SC_EMOJIS}`,
    ].join("\n");

    ANNOUNCEMENT_CHANNEL.send({
      content: content,
      components: [row],
    }).then(() => {
      interaction.editReply({
        content: `Votre annonce va être envoyée dans <#${IDs.ANNOUNCEMENT_CHANNEL}>`,
        ephemeral: true,
      });
    });
  },
};
