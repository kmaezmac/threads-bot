# Threads Bot API

Threads（Meta）に自動投稿するためのVercel Serverless API

## 機能

- テキスト投稿
- 画像付き投稿
- 動画付き投稿
- Vercelで簡単デプロイ

## セットアップ

### 1. Threads API認証情報の取得

1. [Meta for Developers](https://developers.facebook.com/)にアクセス
2. アプリを作成し、Threads APIを有効化
3. アクセストークンとユーザーIDを取得

### 2. プロジェクトのクローンとインストール

```bash
git clone <your-repo-url>
cd threads-bot
npm install
```

### 3. 環境変数の設定

`.env.example`をコピーして`.env`を作成:

```bash
cp .env.example .env
```

`.env`ファイルを編集して、取得した認証情報を設定:

```
THREADS_ACCESS_TOKEN=your_access_token_here
THREADS_USER_ID=your_user_id_here
```

### 4. ローカルでテスト

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセス

### 5. Vercelにデプロイ

```bash
npm run deploy
```

または、Vercel CLIを使用:

```bash
vercel
```

Vercelのダッシュボードで環境変数を設定:
- `THREADS_ACCESS_TOKEN`
- `THREADS_USER_ID`

## API使用方法

### エンドポイント

```
POST /api/post
```

### リクエスト例

#### テキストのみの投稿

```bash
curl -X POST https://your-app.vercel.app/api/post \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello from Threads Bot!"
  }'
```

#### 画像付き投稿

```bash
curl -X POST https://your-app.vercel.app/api/post \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Check out this image!",
    "mediaUrl": "https://example.com/image.jpg",
    "mediaType": "IMAGE"
  }'
```

#### 動画付き投稿

```bash
curl -X POST https://your-app.vercel.app/api/post \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Check out this video!",
    "mediaUrl": "https://example.com/video.mp4",
    "mediaType": "VIDEO"
  }'
```

### JavaScriptから使用

```javascript
async function postToThreads(text, mediaUrl = null, mediaType = 'IMAGE') {
  const response = await fetch('https://your-app.vercel.app/api/post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      mediaUrl,
      mediaType
    })
  });

  const data = await response.json();
  return data;
}

// 使用例
postToThreads('Hello, Threads!')
  .then(data => console.log('投稿成功:', data))
  .catch(error => console.error('エラー:', error));
```

## レスポンス例

### 成功時

```json
{
  "success": true,
  "message": "Post published successfully",
  "postId": "123456789",
  "data": {
    "id": "123456789"
  }
}
```

### エラー時

```json
{
  "error": "Failed to publish post",
  "details": {
    "error": {
      "message": "Invalid access token",
      "type": "OAuthException",
      "code": 190
    }
  }
}
```

## パラメータ

| パラメータ | 型 | 必須 | 説明 |
|----------|------|------|------|
| text | string | はい | 投稿するテキスト |
| mediaUrl | string | いいえ | 画像または動画のURL（公開アクセス可能である必要があります） |
| mediaType | string | いいえ | メディアタイプ（"IMAGE" または "VIDEO"）デフォルト: "IMAGE" |

## 注意事項

- メディアURL（画像・動画）は公開アクセス可能なURLである必要があります
- Threads APIのレート制限に注意してください
- アクセストークンは定期的に更新が必要な場合があります

## トラブルシューティング

### アクセストークンエラー

環境変数が正しく設定されているか確認:

```bash
vercel env ls
```

### メディアアップロードエラー

- メディアURLが公開アクセス可能か確認
- 画像形式: JPG, PNG
- 動画形式: MP4

## ライセンス

MIT
