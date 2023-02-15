const { CommandType, CooldownTypes } = require("wokcommands");
const { ApplicationCommandOptionType } = require("discord.js");
const IDs = require("../../utilities/ids");

module.exports = {
  description: "Permet aux Nitro Booster de changer la couleur de leur rôle",

  type: CommandType.SLASH,
  testOnly: true,
  guildOnly: true,

  delete: false,

  cooldowns: {
    type: CooldownTypes.perUser,
    duration: "10 s",
  },

  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "hex-color",
      description: "La couleur en hexadécimal",
      required: true,
    },
  ],

  callback: async ({ interaction, guild, member }) => {
    await interaction.deferReply({ ephemeral: true });

    const HEX_CODE = interaction.options.getString("hex-color");

    if (!member.roles.cache.has(IDs.BOOST_ROLE)) {
      return interaction.editReply({
        content: "Err: Cette commande est réservée au boosteur du serveur !",
        ephemeral: true,
      });
    }

    if (!HEX_CODE.match(/[0-9A-Fa-f]{6}/g)) {
      return interaction.editReply({
        content: `Code couleur hexadécimal invalide ! Exemples:\n0x00ff00\n#00ff00\n00ff00\n\nTrouvez la couleur parfaite ici :\n<https://www.google.com/search?q=color+picker>`,
        ephemeral: true,
      });
    }

    const name = `CustomRole-${member.id}`;
    const color = HEX_CODE.toUpperCase();
    const { cache } = guild.roles;

    const role = cache.find((role) => role.name === name);

    if (role) {
      role.setColor(color);
      member.roles.add(role);
      return interaction.editReply({
        content: `Couleur du rôle mise à jour !`,
        ephemeral: true,
      });
    }

    const upRole = cache.get(IDs.BOOST_ROLE);

    const newRole = await guild.roles.create({
      name,
      color,
      position: (upRole.rawPosition || 0) + 1,
    });

    console.log(upRole);
    console.log(newRole);

    member.roles.add(newRole);

    return interaction.editReply({
      content: `Couleur du rôle mise à jour !`,
      ephemeral: true,
    });
  },
};
