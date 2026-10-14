const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { addTags, removeTags } = require('../mongoTrending');

router.post('/', async (req, res) => {
  try {
    const { content, userId, media } = req.body;
    let tags = (content || '').match(/#\w+/g) || [];
    tags = [...new Set(tags.map(t => t.toLowerCase()))];
    
    let post = new Post({ 
      content, 
      userId, 
      hashtags: tags,
      media: media || { url: '', mediaType: '', caption: '' }
    });
    await post.save();
    await addTags(tags, post.createdAt);
    post = await Post.findById(post._id).populate('userId', 'username avatar');
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const posts = await Post.find()
    .populate('userId', 'username avatar')
    .populate('comments.userId', 'username avatar')
    .sort({ createdAt: -1 });
  res.json(posts);
});

router.patch('/:id/like', async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required to like a post' });
  }

  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });

  if (!post.likedBy) post.likedBy = [];

  const alreadyLiked = post.likedBy.some(id => id.toString() === userId.toString());

  if (alreadyLiked) {
    // Unlike post
    post.likedBy = post.likedBy.filter(id => id.toString() !== userId.toString());
    post.likes = Math.max(0, (post.likes || 1) - 1);
  } else {
    // Like post
    post.likedBy.push(userId);
    post.likes = (post.likes || 0) + 1;
  }

  await post.save();
  await post.populate('userId', 'username avatar');
  await post.populate('comments.userId', 'username avatar');
  res.json(post);
});

router.post('/:id/comments', async (req, res) => {
  const { userId, content } = req.body;
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $push: { comments: { userId, content } } },
    { new: true }
  ).populate('userId', 'username avatar').populate('comments.userId', 'username avatar');
  if (!post) return res.status(404).json({ error: 'Not found' });
  res.json(post);
});

router.delete('/:id', async (req, res) => {
  const { userId } = req.body; // author checking
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  
  if (post.userId && post.userId.toString() !== userId) {
    return res.status(403).json({ error: 'Only the author can delete this post' });
  }

  await Post.findByIdAndDelete(req.params.id);
  await removeTags(post.hashtags, post.createdAt);
  res.json({ deleted: true });
});

module.exports = router;
