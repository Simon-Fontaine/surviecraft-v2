const { ChannelType, PermissionsBitField } = require("discord.js");

module.exports = {
  createChannel: async (name, guild) => {
    let createdChannel = guild.channels.cache.find((channel) => channel.name === name);

    if (guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels) && !createdChannel) {
      await guild.channels.create({ name: name, type: ChannelType.GuildText });
      createdChannel = guild.channels.cache.find((channel) => channel.name === name);
    }
    if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels) && !createdChannel) {
      console.log(
        "The " + name + " channel does not exist and tried to create the channel but I am lacking permissions"
      );
    }

    return createdChannel;
  },
};
