const Trending = require('./models/Trending');
const todayKey = (date) => (date ? new Date(date) : new Date()).toISOString().slice(0, 10);

async function addTags(tags, date) {
  try {
    const day = todayKey(date);
    const ops = tags.map(tag => ({
      updateOne: {
        filter: { date: day, tag },
        update: { $inc: { score: 1 } },
        upsert: true
      }
    }));
    if (ops.length > 0) await Trending.bulkWrite(ops);
  } catch (err) {
    console.error('Trending update failed:', err);
  }
}

async function removeTags(tags, date) {
  try {
    const day = todayKey(date);
    const ops = tags.map(tag => ({
      updateOne: {
        filter: { date: day, tag },
        update: { $inc: { score: -1 } }
      }
    }));
    if (ops.length > 0) await Trending.bulkWrite(ops);
  } catch (err) {
    console.error('Trending update failed:', err);
  }
}

async function getTop5() {
  try {
    const day = todayKey();
    const top = await Trending.find({ date: day, score: { $gt: 0 } })
      .sort({ score: -1, tag: -1 })
      .limit(5);
    return top.map(t => ({ value: t.tag, score: t.score }));
  } catch (err) {
    console.error('Trending fetch failed:', err);
    return [];
  }
}

module.exports = { addTags, removeTags, getTop5 };
