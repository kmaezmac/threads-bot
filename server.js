require('dotenv').config();
const express = require('express');
const postHandler = require('./api/post');
const rakutenHandler = require('./api/rakuten');
const meHandler = require('./api/me');
const debugHandler = require('./api/debug');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ヘルスチェック
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Threads Bot API is running',
    endpoints: {
      post: '/api/post',
      rakuten: '/api/rakuten',
      me: '/api/me'
    }
  });
});

// Vercel Serverless Functionをラップ
app.get('/api/post', async (req, res) => {
  await postHandler(req, res);
});

app.post('/api/post', async (req, res) => {
  await postHandler(req, res);
});

// 楽天API -> Threads投稿エンドポイント
app.get('/api/rakuten', async (req, res) => {
  await rakutenHandler(req, res);
});

app.post('/api/rakuten', async (req, res) => {
  await rakutenHandler(req, res);
});

// ユーザー情報取得エンドポイント
app.get('/api/me', async (req, res) => {
  await meHandler(req, res);
});

// デバッグエンドポイント
app.get('/api/debug', async (req, res) => {
  await debugHandler(req, res);
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📝 POST endpoint: http://localhost:${PORT}/api/post`);
  console.log(`👤 User info: http://localhost:${PORT}/api/me`);
  console.log(`🔍 Debug: http://localhost:${PORT}/api/debug`);
});
