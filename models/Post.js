const mongoose = require('mongoose');
const CommentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: true },
  hashtags: [{ type: String }],
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  media: {
    url: { type: String, default: '' },
    mediaType: { type: String, default: '' },
    caption: { type: String, default: '' }
  },
  comments: [CommentSchema],
  createdAt: { type: Date, default: Date.now },
});
PostSchema.index({ content: 'text', hashtags: 'text' });
module.exports = mongoose.model('Post', PostSchema);
