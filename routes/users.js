const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || user.password !== password) return res.status(401).json({ error: 'Invalid credentials' });
  res.json(user);
});

router.post('/', async (req, res) => {
  try {
    const { username, password, email, bio, avatar } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, password, and email are required' });
    }
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const defaultAvatar = avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`;
    const user = new User({
      username,
      password,
      email,
      bio: bio || '',
      avatar: defaultAvatar
    });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.patch('/:id/avatar', async (req, res) => {
  const { avatar } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { avatar }, { new: true });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.get('/:id/posts', async (req, res) => {
  const Post = require('../models/Post');
  const posts = await Post.find({ userId: req.params.id })
    .populate('userId', 'username avatar')
    .populate('comments.userId', 'username avatar')
    .sort({ createdAt: -1 });
  res.json(posts);
});

module.exports = router;
