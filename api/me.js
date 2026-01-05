const fetch = require('node-fetch');

/**
 * Threads APIからユーザー情報を取得するエンドポイント
 * アクセストークンから数値のユーザーIDを取得できます
 */
module.exports = async (req, res) => {
  // CORSヘッダー設定
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // OPTIONSリクエストへの対応
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const accessToken = process.env.THREADS_ACCESS_TOKEN;

    if (!accessToken) {
      return res.status(500).json({
        error: 'Missing configuration',
        message: 'THREADS_ACCESS_TOKEN must be set in environment variables'
      });
    }

    // Threads APIでユーザー情報を取得
    const response = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url,threads_biography&access_token=${accessToken}`
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to fetch user info',
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      user: data,
      message: `ユーザーID: ${data.id} を .env ファイルの THREADS_USER_ID に設定してください`
    });

  } catch (error) {
    console.error('Error fetching user info:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
