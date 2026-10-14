require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/socialSearchDB';

const User = require('./models/User');
const Post = require('./models/Post');
const Trending = require('./models/Trending');
const { addTags } = require('./mongoTrending');

const users = [
  { 
    username: 'anaushka', 
    password: 'password123', 
    email: 'anaushka@example.com', 
    bio: 'Loves databases & distributed systems',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=anaushka'
  },
  { 
    username: 'anujaya', 
    password: 'password123', 
    email: 'anujaya@example.com', 
    bio: 'Backend, caching, and scalable APIs',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=anujaya'
  },
  { 
    username: 'nandana', 
    password: 'password123', 
    email: 'nandana@example.com', 
    bio: 'Frontend, UI/UX, and graph visualization',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=nandana'
  },
  { 
    username: 'rohit', 
    password: 'password123', 
    email: 'rohit@example.com', 
    bio: 'Cloud architect & Kubernetes explorer',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=rohit'
  },
  { 
    username: 'priya', 
    password: 'password123', 
    email: 'priya@example.com', 
    bio: 'Full-stack developer & open-source enthusiast',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=priya'
  },
  { 
    username: 'arjun', 
    password: 'password123', 
    email: 'arjun@example.com', 
    bio: 'AI/ML engineer experimenting with vector databases',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=arjun'
  },
  { 
    username: 'zoya', 
    password: 'password123', 
    email: 'zoya@example.com', 
    bio: 'Product designer & creative technologist',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=zoya'
  },
];

const posts = [
  { author: 0, content: 'Learning NoSQL is fun! #nosql #mongodb', hashtags: ['#nosql', '#mongodb'], likes: 12 },
  { author: 1, content: 'Redis is great for caching! #redis #backend', hashtags: ['#redis', '#backend'], likes: 8 },
  { author: 2, content: 'Graph databases with Neo4j #neo4j #graphdb', hashtags: ['#neo4j', '#graphdb'], likes: 5 },
  { author: 0, content: 'MongoDB aggregation pipelines #mongodb #nosql', hashtags: ['#mongodb', '#nosql'], likes: 20 },
  { author: 1, content: 'Building a social engine #nosql #project', hashtags: ['#nosql', '#project'], likes: 15 },
];

async function seedMongo() {
  await mongoose.connect(MONGO_URI, { tlsAllowInvalidCertificates: true });
  await Promise.all([User.deleteMany({}), Post.deleteMany({}), Trending.deleteMany({})]);
  await Promise.all([User.init(), Post.init(), Trending.init()]);

  const savedUsers = await User.insertMany(users);
  
  const now = Date.now();
  const docs = posts.map((p, i) => ({
    userId: savedUsers[p.author]._id,
    content: p.content,
    hashtags: p.hashtags,
    likes: p.likes,
    createdAt: new Date(now - (posts.length - i) * 60 * 1000),
  }));
  await Post.insertMany(docs);
  
  for (const doc of docs) {
    await addTags(doc.hashtags, doc.createdAt);
  }
  
  console.log(`MongoDB: inserted ${savedUsers.length} users, ${docs.length} posts, and populated trending.`);
}

async function selfCheck() {
  console.log('\n--- Check 1: top 5 hashtags by count (report 6.1) ---');
  const top = await Post.aggregate([
    { $unwind: '$hashtags' },
    { $group: { _id: '$hashtags', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: 5 },
  ]);
  console.table(top.map(t => ({ hashtag: t._id, count: t.count })));

  console.log('--- Check 2: total likes per hashtag (report 6.2) ---');
  const likes = await Post.aggregate([
    { $unwind: '$hashtags' },
    { $group: { _id: '$hashtags', totalLikes: { $sum: '$likes' } } },
    { $sort: { totalLikes: -1, _id: 1 } },
  ]);
  console.table(likes.map(t => ({ hashtag: t._id, totalLikes: t.totalLikes })));

  console.log('--- Check 3: text search for "nosql" (expect 3 posts: 20, 15, 12 likes) ---');
  const found = await Post.find({ $text: { $search: 'nosql' } }).sort({ likes: -1 });
  console.table(found.map(p => ({ likes: p.likes, content: p.content })));
}

(async () => {
  try {
    await seedMongo();
    await selfCheck();
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
