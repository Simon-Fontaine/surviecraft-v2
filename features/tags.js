const { Events } = require("discord.js");
const tagSchema = require("../models/tag-schema");

let tags = [];

exports.default = async (instance) => {
  const results = await tagSchema.find();

  for (const { _id: tag, message, keywords } of results) {
    tags.push({ tag, message, keywords });
  }

  instance.client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) {
      return;
    }

    const text = checkForTag(message.content);
    if (text) {
      message.reply(text);
    }
  });
};

const addTag = (tag, message, keywords) => {
  tags.push({ tag, message, keywords });
};
exports.addTag = addTag;

const removeTag = (tag) => {
  tags = tags.filter((t) => t.tag !== tag);
};
exports.removeTag = removeTag;

const checkForTag = (content) => {
  content = content.toLowerCase();

  for (const { message, keywords = [] } of tags) {
    for (const word of keywords) {
      if (content.includes(word)) {
        return message;
      }
    }
  }
};
exports.checkForTag = checkForTag;
