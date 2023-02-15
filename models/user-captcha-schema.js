const { Schema, model, models } = require("mongoose");

const reqString = {
  type: String,
};

const userCaptchaSchema = new Schema({
  guild_id: reqString,
  user_id: reqString,
  being_verified: {
    type: Boolean,
    default: false,
  },
  verified: {
    type: Boolean,
    default: false,
  },
});

const name = "user-captcha";

module.exports = models[name] || model(name, userCaptchaSchema);
