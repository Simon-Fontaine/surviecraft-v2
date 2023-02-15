const { Schema, model, models } = require("mongoose");

const ticketJoueurMessageSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  messageId: {
    type: String,
    required: true,
  },
});

const name = "message-ticket-joueur-schema";

module.exports = models[name] || model(name, ticketJoueurMessageSchema);
