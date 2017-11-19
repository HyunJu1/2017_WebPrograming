var mongoose = require('mongoose'),
    mongoosePaginate = require('mongoose-paginate'),
    Schema = mongoose.Schema;

var schema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  title: {type: String, trim: true, required: true},
  content: {type: String, trim: true, required: true},
  editor: {type: String, trim: true, required: false},
  image: { data: Buffer, contentType: String },
  location: {type: String, trim: true, required: true},
  topic: {type: String, trim:true, required: false},
  eventType: {type: String, trim:true, required: false},
  startTime: {type: String, trim: true, required: false},
  endTime: {type: String, trim: true, required: false},
  RegisOrgan: {type: String, trim: true, required: false},
  RegisOrganCon: {type: String, trim: true, required: false},
  price: {type: Number, trim: true, required: false},
  participantN: {type: Number, required:false, default:0},
  participantL: [{type: Schema.Types.ObjectId, ref: 'User'}],
  tags: [String],
  numLikes: {type: Number, default: 0},
  numAnswers: {type: Number, default: 0},
  numReads: {type: Number, default: 0},
  createdAt: {type: Date, default: Date.now}
}, {
  toJSON: { virtuals: true},
  toObject: {virtuals: true}
});
schema.plugin(mongoosePaginate);
var Question = mongoose.model('Question', schema);

module.exports = Question;
