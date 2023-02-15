const statusOptions = ["play.surviecraft.fr", "Membres Discord !"];
let counter = 0;

module.exports = async (instance, client) => {
  const updateStatus = async () => {
    let text = statusOptions[counter];

    if (text === "Membres Discord !") {
      try {
        text = `${client.guilds.cache.first()?.memberCount.toLocaleString()} ${text}`;
      } catch (ignored) {
        ++counter;
      }
    }

    if (++counter >= statusOptions.length) {
      counter = 0;
    }

    client.user?.setActivity(text);

    setTimeout(async () => {
      await updateStatus();
    }, 1000 * 60);
  };

  updateStatus();
};
