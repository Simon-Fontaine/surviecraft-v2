const { Schema, model, models } = require("mongoose");

const reqString = {
  type: String,
};

const ticketUserSchema = new Schema({
  guild_id: reqString,
  user_id: reqString,
  creating_ticket: {
    type: Boolean,
    default: false,
  },
});

const name = "ticket-user-schema";

module.exports = models[name] || model(name, ticketUserSchema);
