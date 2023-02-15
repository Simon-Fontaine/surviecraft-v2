const ticketUserSchema = require("../models/ticket-user-schema.js");
const captchaUserShema = require("../models/user-captcha-schema.js");

module.exports = async (instance, client) => {
  await ticketUserSchema.updateMany({ creating_ticket: true }, { creating_ticket: false });
  await captchaUserShema.updateMany({ being_verified: true }, { being_verified: false });
};
