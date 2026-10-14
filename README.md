# Social Search and Discovery Engine

A small social media website where users can sign up, post text or photos, like and comment on posts, search by hashtag, and see which hashtags are trending today. It was our NoSQL project, built with MongoDB as the database.

This was a team project with two of my teammates. We used an AI coding assistant to help build it.

## My part

I planned and designed the MongoDB side of the project: which collections we need, what goes inside a document and what gets referenced, the indexes, and the queries for search, trending and the aggregation pipelines.

## What it does

- Sign up and log in
- Create posts with text and an optional photo
- Hashtags are picked out of the post text automatically
- Like and unlike posts (one like per user)
- Comment on posts
- Only the author can delete their own post
- Search posts by hashtag or keyword
- Trending: the top 5 hashtags of the day
- Profile page that shows all posts by a user

## Database design (MongoDB)

Database name: `socialSearchDB`. It has 3 collections.

| Collection | What it stores |
|---|---|
| `users` | username (unique), password, email, bio, avatar |
| `posts` | content, hashtags, likes, likedBy, media, comments, createdAt |
| `trending` | one document per hashtag per day, with a score |

Some of the design choices and why we made them:

- **Hashtags, comments and media are embedded inside the post.** They are almost always read together with the post, so one query gets everything.
- **The author is referenced by `userId`, not copied.** The username and avatar can change, so we use `populate` to fetch the latest version.
- **`likedBy` is an array of user IDs.** That is how we stop one user liking the same post twice.
- **Text index on `content` and `hashtags`** powers the search. A collection can only have one text index.
- **Separate `trending` collection with an index on `{ date: 1, score: -1 }`.** It makes "today's top tags" fast. The score goes up by 1 when a post is created and down by 1 when it is deleted, using `$inc` with `upsert`.
- Photos are stored as base64 text inside the post document.

Aggregation pipelines we used: `$unwind`, `$group`, `$sort` and `$limit`, for example for the top hashtags and total likes per hashtag.

## Tech used

- Node.js and Express (backend)
- MongoDB with Mongoose
- HTML, CSS and JavaScript (frontend, one `index.html` served by Express)
- dotenv and cors

## Project structure

```
social-engine/
├── server.js            # starts the server, connects to MongoDB
├── index.html           # the frontend
├── seed.js              # fills the database with sample data
├── mongoTrending.js     # trending score logic
├── models/              # User.js, Post.js, Trending.js
└── routes/              # users.js, posts.js, search.js
```

## How to run it

1. Install Node.js and MongoDB (running on `localhost:27017`).
2. Install the libraries:
   ```
   npm install
   ```
3. Create a `.env` file in the project folder:
   ```
   MONGO_URI=mongodb://localhost:27017/socialSearchDB
   ```
4. Load the sample data:
   ```
   npm run seed
   ```
5. Start the server:
   ```
   npm start
   ```
6. Open `http://localhost:3000`. A sample login is `anaushka` / `password123`.

If you use MongoDB Atlas instead, put your Atlas connection string in `MONGO_URI` and allow your IP in Atlas network access.

## Limitations

- Passwords are saved as plain text. They should be hashed (for example with bcrypt).
- There is no token-based login, so the server trusts the user ID sent by the frontend.
- Photos stored inside documents make them large. A real app would keep images in file storage and save only the link.
- `likedBy` grows with every like, so it would be a problem for posts with huge numbers of likes.
- The frontend has the API address hardcoded as `localhost:3000`, so it needs a small change before it can be deployed.
- Sharding and replication are not implemented.

## What we could add next

- Password hashing and proper login with tokens
- Pagination for the feed
- Following other users and a personal feed
- An AI feature, like hashtag suggestions when writing a post
- Deploying it with a live link
