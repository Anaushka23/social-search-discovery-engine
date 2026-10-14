const mongoose = require('mongoose');
const TrendingSchema = new mongoose.Schema({
  date: { type: String, required: true },
  tag: { type: String, required: true },
  score: { type: Number, default: 0 }
});
TrendingSchema.index({ date: 1, score: -1 });
module.exports = mongoose.model('Trending', TrendingSchema);
