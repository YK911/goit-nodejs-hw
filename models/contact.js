const { Schema, model } = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const contact = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
});

contactSchema.plugin(mongoosePaginate);

module.exports = model("Contact", contact);
