const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const news_schema = new Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  creationDate: { type: Date, default: Date.now },
  publicationDate: { type: Date, default: Date.now, index: true },
  isVisible: { type: Boolean, default: false, index: true }
}, {
  timestamps: true
});

const News = mongoose.model('News', news_schema);
module.exports = News;