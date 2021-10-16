'use strict';
const pug = require('pug');

/**
 * アクセス処理を行う関数
 * @param {*} req リクエスト
 * @param {*} res レスポンス
 */
function handle(req, res) {
    switch (req.method) {
        case 'GET':
            res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8'    
            });
            res.end(pug.renderFile('./views/posts.pug'));
            break;
        case 'POST':
            let body = [];
            // リクエストでdataとendを受け取った際の処理
            req.on('data', (chunk) => {
                body.push(chunk);
            }).on('end', () => {
                body = Buffer.concat(body).toString(); // 受け取ったデータを文字列に変換
                // decodedをURLSearchParamsの形式に変換
                const params = new URLSearchParams(body);
                // キーの値を取得
                const content = params.get('content');
                // ログを出力し、関数を呼び出す
                console.info(`投稿されました: ${content}`);
                handleRedirectPosts(req, res);
            });
            break;
        default:
            break;
    }
}

/**
 * リダイレクトをハンドリングする関数
 * @param {*} req リクエスト
 * @param {*} res レスポンス
 */
function handleRedirectPosts(req, res) {
    // 303: POSTでアクセスした際に、処理の後、GETでも同じパスにアクセスし直す 
    res.writeHead(303, {
        'Location': '/posts'
    });
    res.end();
}

module.exports = { handle };
