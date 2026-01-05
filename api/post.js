const fetch = require('node-fetch');
const axios = require('axios');

/**
 * Threads API投稿エンドポイント
 * Vercel Serverless Function
 * useRakuten=trueの場合、楽天APIから商品を取得して投稿
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

  // GETとPOSTメソッドを許可
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // GETの場合はクエリパラメータ、POSTの場合はボディから取得
    let text, mediaUrl, mediaType, useRakuten;

    if (req.method === 'GET') {
      text = req.query.text;
      mediaUrl = req.query.mediaUrl;
      mediaType = req.query.mediaType;
      useRakuten = req.query.useRakuten;
    } else {
      ({ text, mediaUrl, mediaType, useRakuten } = req.body);
    }

    // デフォルトで楽天APIを使用（textが指定されている場合は除く）
    // useRakuten=falseで明示的に無効化できる
    const shouldUseRakuten = !text && useRakuten !== 'false' && useRakuten !== false;

    // 楽天APIから商品を取得
    let rakutenItem = null;
    if (shouldUseRakuten || useRakuten === true || useRakuten === 'true') {
      // 年齢層のランダム選択
      const ages = [20, 30, 40];
      const age = ages[Math.floor(Math.random() * ages.length)];

      // ページのランダム選択
      const random = Math.floor(Math.random() * 34) + 1;

      // 楽天APIのリクエストURL構築
      const requestUrl = `https://app.rakuten.co.jp/services/api/IchibaItem/Ranking/20220601?applicationId=${process.env.RAKUTEN_APP_ID}&age=${age}&sex=1&carrier=0&page=${random}`;

      try {
        const rakutenResponse = await axios.get(requestUrl);

        if (rakutenResponse.status === 200 && rakutenResponse.data.Items && rakutenResponse.data.Items.length > 0) {
          // ランダムに商品を選択
          const randomNo = Math.floor(Math.random() * rakutenResponse.data.Items.length);
          const item = rakutenResponse.data.Items[randomNo].Item;

          // 画像URLから解像度指定パラメータを削除
          let imageUrl = item.imageUrl || (item.mediumImageUrls && item.mediumImageUrls.length > 0
            ? item.mediumImageUrls[0].imageUrl
            : null);

          // ?_ex=128x128 などの解像度指定を削除して高画質化
          if (imageUrl) {
            imageUrl = imageUrl.replace(/\?_ex=\d+x\d+/, '');
          }

          rakutenItem = {
            itemName: item.itemName,
            catchcopy: item.catchcopy || '',
            url: item.affiliateUrl || item.itemUrl,
            imageUrl: imageUrl
          };

          // 投稿テキストを作成
          const tweetText = rakutenItem.itemName + (rakutenItem.catchcopy ? '\n' + rakutenItem.catchcopy : '');
          text = tweetText.substring(0, 400) + "\n\n" + rakutenItem.url + "\n\n#楽天ROOM #楽天 #楽天市場 #ad #PR";
          mediaUrl = rakutenItem.imageUrl;
          mediaType = 'IMAGE';
        } else {
          return res.status(404).json({
            success: false,
            error: 'No items found from Rakuten API'
          });
        }
      } catch (rakutenError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch from Rakuten API',
          message: rakutenError.message
        });
      }
    }

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

      // メディア処理のための待機時間（画像の場合は3秒、動画の場合は10秒）
      const waitTime = mediaType === 'VIDEO' ? 10000 : 3000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
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

    const responseData = {
      success: true,
      message: 'Post published successfully',
      postId: publishData.id,
      data: publishData
    };

    // 楽天商品の情報がある場合は含める
    if (rakutenItem) {
      responseData.rakutenItem = rakutenItem;
    }

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Error posting to Threads:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
