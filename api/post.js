const fetch = require('node-fetch');

/**
 * Threads API投稿エンドポイント
 * Vercel Serverless Function
 */
module.exports = async (req, res) => {
  // CORSヘッダー設定
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // OPTIONSリクエストへの対応
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, mediaUrl, mediaType } = req.body;

    // 環境変数からアクセストークンを取得
    const accessToken = process.env.THREADS_ACCESS_TOKEN;
    const userId = process.env.THREADS_USER_ID;

    if (!accessToken || !userId) {
      return res.status(500).json({
        error: 'Missing configuration',
        message: 'THREADS_ACCESS_TOKEN and THREADS_USER_ID must be set in environment variables'
      });
    }

    if (!text) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Text is required'
      });
    }

    // Step 1: メディアコンテナの作成
    let containerId;

    if (mediaUrl) {
      // 画像または動画付き投稿
      const mediaParams = new URLSearchParams({
        media_type: mediaType || 'IMAGE',
        image_url: mediaType === 'VIDEO' ? undefined : mediaUrl,
        video_url: mediaType === 'VIDEO' ? mediaUrl : undefined,
        text: text,
        access_token: accessToken
      });

      // undefinedのパラメータを削除
      for (let [key, value] of [...mediaParams.entries()]) {
        if (value === undefined || value === 'undefined') {
          mediaParams.delete(key);
        }
      }

      const createResponse = await fetch(
        `https://graph.threads.net/v1.0/${userId}/threads`,
        {
          method: 'POST',
          body: mediaParams
        }
      );

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        return res.status(createResponse.status).json({
          error: 'Failed to create media container',
          details: createData
        });
      }

      containerId = createData.id;
    } else {
      // テキストのみの投稿
      const createResponse = await fetch(
        `https://graph.threads.net/v1.0/${userId}/threads`,
        {
          method: 'POST',
          body: new URLSearchParams({
            media_type: 'TEXT',
            text: text,
            access_token: accessToken
          })
        }
      );

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        return res.status(createResponse.status).json({
          error: 'Failed to create text container',
          details: createData
        });
      }

      containerId = createData.id;
    }

    // Step 2: 投稿を公開
    const publishResponse = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads_publish`,
      {
        method: 'POST',
        body: new URLSearchParams({
          creation_id: containerId,
          access_token: accessToken
        })
      }
    );

    const publishData = await publishResponse.json();

    if (!publishResponse.ok) {
      return res.status(publishResponse.status).json({
        error: 'Failed to publish post',
        details: publishData
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Post published successfully',
      postId: publishData.id,
      data: publishData
    });

  } catch (error) {
    console.error('Error posting to Threads:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
