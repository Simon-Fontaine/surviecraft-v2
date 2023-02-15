const IDs = require("../utilities/ids");
const axios = require("axios");

module.exports = async (instance, client) => {
  const guild = client.guilds.cache.get(IDs.GUILD);
  const voiceChannel = guild.channels.cache.get(IDs.MINECRAFT_MEMBER_COUNT_CHANNEL);

  if (!guild || !voiceChannel) {
    return console.log("Invalid guild or voice channel for minecraft member count feature.");
  }

  const updateChannelName = async () => {
    try {
      const { data } = await axios.get("https://minecraft-api.com/api/ping/online/play.surviecraft.fr/25565");

      if (voiceChannel.name !== `En jeu: ${data}`) {
        voiceChannel.setName(`En jeu: ${data}`);
      }
    } catch (error) {
      if (voiceChannel.name !== `En jeu: Error`) {
        voiceChannel.setName(`En jeu: Error`);
      }
    }

    setTimeout(updateChannelName, 1000 * 60);
  };
  updateChannelName();
};
