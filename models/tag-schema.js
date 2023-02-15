const { Schema, model, models } = require("mongoose");

const reqString = {
  type: String,
  required: true,
};

const tagSchema = new Schema({
  _id: reqString, // Tag ID
  message: reqString,
  keywords: [reqString],
});

const name = "tags";

module.exports = models[name] || model(name, tagSchema);
