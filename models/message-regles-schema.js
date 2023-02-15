const { Schema, model, models } = require("mongoose");

const captchaMessageSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  messageId: {
    type: String,
    required: true,
  },
});

const name = "message-regles-schema";

module.exports = models[name] || model(name, captchaMessageSchema);
