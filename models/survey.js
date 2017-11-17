const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

var schema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User'},
  question: { type: Schema.Types.ObjectId, ref: 'Question'},
  survey_sosok: {type: String, trim: true},
  survey_reason: {type: String, trim: true}
}, {
  toJSON: { virtuals: true},
  toObject: {virtuals: true}
});
var Survey = mongoose.model('Survey', schema);

module.exports = Survey;
