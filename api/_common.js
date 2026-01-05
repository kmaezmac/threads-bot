const axios = require('axios');
const fetch = require('node-fetch');

// Threads API用のクライアント関数
const threadsClient = {
  async post(text, mediaUrl = null, mediaType = 'IMAGE') {
    const accessToken = process.env.THREADS_ACCESS_TOKEN;
    const userId = process.env.THREADS_USER_ID;

    if (!accessToken || !userId) {
      throw new Error('Missing THREADS_ACCESS_TOKEN or THREADS_USER_ID');
    }

    // Step 1: メディアコンテナの作成
    let containerId;

    if (mediaUrl) {
      const mediaParams = new URLSearchParams({
        media_type: mediaType,
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
        throw new Error(`Failed to create media container: ${JSON.stringify(createData)}`);
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
        throw new Error(`Failed to create text container: ${JSON.stringify(createData)}`);
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
      throw new Error(`Failed to publish post: ${JSON.stringify(publishData)}`);
    }

    return publishData;
  }
};

module.exports = {
  client: threadsClient,
  axios: axios
};
