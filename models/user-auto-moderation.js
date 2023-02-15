const { Schema, model, models } = require("mongoose");

const reqString = {
  type: String,
};

const userAutoModerationSchema = new Schema({
  guild_id: reqString,
  user_id: reqString,
  number_of_actions: {
    type: Number,
    default: 0,
  },
});

const name = "user-auto-moderation-schema";

module.exports = models[name] || model(name, userAutoModerationSchema);
