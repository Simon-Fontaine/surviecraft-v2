const { CommandType, CooldownTypes } = require("wokcommands");
const { EmbedBuilder } = require("discord.js");
const IDs = require("../../utilities/ids");

module.exports = {
  description: "Edit Channels Permissions",

  type: CommandType.SLASH,
  testOnly: true,
  guildOnly: true,

  delete: false,

  ownerOnly: true,

  cooldowns: {
    type: CooldownTypes.perUser,
    duration: "3 s",
  },

  callback: async ({ interaction, guild }) => {
    await interaction.deferReply({ ephemeral: true });

    const role = await guild.roles.cache.get(IDs.CAPTCHA_ROLE);

    guild.channels.cache.forEach((channel) => {
      try {
        channel.permissionOverwrites.edit(role, { ViewChannel: false });
      } catch (error) {}
    });

    interaction.editReply({
      content: `Les permissions des channels ont été modifiées.`,
      ephemeral: true,
    });
  },
};
