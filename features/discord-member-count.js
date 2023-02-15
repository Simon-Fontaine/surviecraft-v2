const IDs = require("../utilities/ids");

module.exports = async (instance, client) => {
  const guild = client.guilds.cache.get(IDs.GUILD);
  const voiceChannel = guild.channels.cache.get(IDs.DISCORD_MEMBER_COUNT_CHANNEL);

  if (!guild || !voiceChannel) {
    return console.log("Invalid guild or voice channel for discord member count feature.");
  }

  const updateChannelName = () => {
    if (voiceChannel.name !== `Membres Discord: ${guild.memberCount.toLocaleString()}`) {
      voiceChannel.setName(`Membres Discord: ${guild.memberCount.toLocaleString()}`);
    }

    setTimeout(updateChannelName, 1000 * 60);
  };
  updateChannelName();
};
