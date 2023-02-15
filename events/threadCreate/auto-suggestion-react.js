const { ChannelType } = require("discord.js");
const IDs = require("../../utilities/ids");

module.exports = async (thread, instance) => {
  if (thread.type !== ChannelType.PublicThread) return;
  if (thread.parentId !== IDs.SUGGESTION_CHANNEL) return;

  const message = await thread.messages.fetch(thread.id);
  message.react("👍🏼");
};
