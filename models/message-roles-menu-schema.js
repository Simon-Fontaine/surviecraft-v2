const { Schema, model, models } = require("mongoose");

const rolesMenuMessageSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  messageId: {
    type: String,
    required: true,
  },
});

const name = "message-roles-menu-schema";

module.exports = models[name] || model(name, rolesMenuMessageSchema);
