const { Schema, model, models } = require("mongoose");

const ticketStaffMessageSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  messageId: {
    type: String,
    required: true,
  },
});

const name = "message-ticket-staff-schema";

module.exports = models[name] || model(name, ticketStaffMessageSchema);
