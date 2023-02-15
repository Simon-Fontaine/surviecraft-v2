const { Schema, model, models } = require("mongoose");

const invitesMessageSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  messageId: {
    type: String,
    required: true,
  },
});

const name = "message-invites-schema";

module.exports = models[name] || model(name, invitesMessageSchema);
