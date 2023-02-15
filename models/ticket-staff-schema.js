const { Schema, model, models } = require("mongoose");

const reqString = {
  type: String,
};

const ticketStaffSchema = new Schema(
  {
    ticket_id: {
      type: Number,
    },
    guild_id: reqString,
    users_id: [reqString],
    owner_id: reqString,
    owner_tag: reqString,
    mod_id: reqString,
    mod_tag: reqString,
    channel_id: reqString,
    type: reqString,
    closed: {
      type: Boolean,
      default: false,
    },
    locked: {
      type: Boolean,
      default: false,
    },
    claimed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const name = "ticket-staff-schema";

module.exports = models[name] || model(name, ticketStaffSchema);
