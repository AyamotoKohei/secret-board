'use strict';

const postsHandler = require('./posts-handler');

/**
 * リクエストの振り分け処理を行う関数
 * @param {*} req リクエスト
 * @param {*} res レスポンス
 */
function route(req, res) {
    switch (req.url) {
        // '/ports'パスにアクセスがあったときhandle関数を実行
        case '/posts':
            postsHandler.handle(req, res);
            break;
        case '/logout':
            // TODO ログアウト処理
            break;
        default:
            break;
    }
}

module.exports = { route };