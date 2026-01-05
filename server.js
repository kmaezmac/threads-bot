require('dotenv').config();
const express = require('express');
const postHandler = require('./api/post');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Vercel Serverless Functionをラップ
app.get('/api/post', async (req, res) => {
  await postHandler(req, res);
});

app.post('/api/post', async (req, res) => {
  await postHandler(req, res);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Endpoint: http://localhost:${PORT}/api/post`);
});
