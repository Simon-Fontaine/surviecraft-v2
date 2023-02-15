const historySchema = require("../models/history-schema.js");

module.exports = (instance, client) => {
  const check = async () => {
    const query = {
      expires: { $lt: new Date() },
      type: "+ban",
      unbanned: false,
    };

    const results = await historySchema.find(query);

    for (const result of results) {
      const { guild_id, user_id, user_tag, type } = result;

      const guild = await client.guilds.fetch(guild_id);
      if (!guild) {
        console.log(`Guild ${guild_id} not found.`);
        continue;
      }

      if (type === "+ban") {
        guild.members.unban(user_id, { reason: "Expired ban" }).catch(() => {});
        console.log(`Unbanned ${user_tag} in ${guild_id}`);
      }
    }

    await historySchema.updateMany(query, { unbanned: true });

    setTimeout(check, 1000 * 60);
  };
  check();
};
