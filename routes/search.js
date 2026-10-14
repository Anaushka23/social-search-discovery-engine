const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { getTop5 } = require('../mongoTrending');

router.get('/trending', async (req, res) => {
  const tags = await getTop5();
  res.json(tags);
});

router.get('/', async (req, res) => {
  const { tag } = req.query;
  if (!tag) return res.status(400).json({ error: 'tag is missing' });
  
  const searchTag = tag.startsWith('#') ? tag : `#${tag}`; // Format for full match
  const posts = await Post.find({ $text: { $search: tag } })
    .populate('userId', 'username avatar')
    .populate('comments.userId', 'username avatar')
    .sort({ likes: -1 });
  res.json(posts);
});

module.exports = router;
