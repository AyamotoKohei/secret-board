'use strict';

const postsHandler = require('./posts-handler');
const util = require('./handler-util');

/**
 * リクエストの振り分け処理を行う関数
 * @param {*} req リクエスト
 * @param {*} res レスポンス
 */
function route(req, res) {
    // 本番環境でヘッダの値がhttpであるとき
    if (process.env.DATABASE_URL && req.headers['x-forwarded-proto'] === 'http') {
        // httpの時は404を返す
        util.handleNotFound(req, res);
    }
    switch (req.url) {
        // '/ports'パスにアクセスがあったときhandle関数を実行
        case '/posts':
            postsHandler.handle(req, res);
            break;
        case '/posts?delete=1':
            postsHandler.handleDelete(req, res);
            break;
        case '/logout':
            util.handleLogout(req, res);
            break;
        // faviconへのリクエストをルーティング
        case '/favicon.ico' :
            util.handleFavicon(req, res);
            break;
        default:
            util.handleNotFound(req, res);
            break;
    }
}

module.exports = { route };
