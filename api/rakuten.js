const { client, axios } = require("./_common.js");

/**
 * 楽天APIから商品を取得してThreadsに投稿するエンドポイント
 */
module.exports = async function handler(req, res) {
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

    // GETまたはPOSTメソッドを許可
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 年齢層のランダム選択
    var args = [20, 30, 40];
    var age = args[Math.floor(Math.random() * args.length)];

    // ページのランダム選択
    var random = Math.floor(Math.random() * 34) + 1;

    // 楽天APIのリクエストURL構築
    var requestUrl = "https://app.rakuten.co.jp/services/api/IchibaItem/Ranking/20220601?applicationId=" + process.env.RAKUTEN_APP_ID
        + "&age=" + age + "&sex=1&carrier=0&page=" + random;

    try {
        // 楽天APIを呼び出し
        const response = await axios.get(requestUrl);

        if (response.status === 200 && response.data.Items && response.data.Items.length > 0) {
            // ランダムに商品を選択
            var randomNo = Math.floor(Math.random() * response.data.Items.length);
            var item = response.data.Items[randomNo].Item;

            var itemName = item.itemName;
            var catchcopy = item.catchcopy || '';
            var affiliateUrl = item.affiliateUrl;
            var imageUrl = item.mediumImageUrls && item.mediumImageUrls.length > 0
                ? item.mediumImageUrls[0].imageUrl
                : null;

            // 投稿テキストを作成
            var tweetText = itemName + (catchcopy ? '\n' + catchcopy : '');
            var postText = tweetText.substring(0, 400) + "\n\n" + affiliateUrl + "\n\n#楽天ROOM #楽天 #楽天市場 #ad #PR";

            // Threadsに投稿
            const threadsResult = await client.post(postText, imageUrl, 'IMAGE');

            return res.status(200).json({
                success: true,
                message: 'Posted to Threads successfully',
                rakutenItem: {
                    itemName: itemName,
                    catchcopy: catchcopy,
                    url: affiliateUrl,
                    imageUrl: imageUrl
                },
                threadsPostId: threadsResult.id
            });
        } else {
            return res.status(404).json({
                success: false,
                error: 'No items found from Rakuten API'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};
