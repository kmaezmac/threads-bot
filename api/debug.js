/**
 * デバッグ用エンドポイント - 環境変数の確認
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');

  const hasAccessToken = !!process.env.THREADS_ACCESS_TOKEN;
  const hasUserId = !!process.env.THREADS_USER_ID;
  const hasRakutenAppId = !!process.env.RAKUTEN_APP_ID;

  return res.status(200).json({
    env_loaded: {
      THREADS_ACCESS_TOKEN: hasAccessToken ? `設定済み (${process.env.THREADS_ACCESS_TOKEN.substring(0, 20)}...)` : '未設定',
      THREADS_USER_ID: hasUserId ? `設定済み (${process.env.THREADS_USER_ID})` : '未設定',
      RAKUTEN_APP_ID: hasRakutenAppId ? `設定済み (${process.env.RAKUTEN_APP_ID})` : '未設定'
    },
    message: hasAccessToken && hasUserId ? '環境変数は正しく読み込まれています' : '環境変数が読み込まれていません。サーバーを再起動してください。'
  });
};
