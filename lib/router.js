'use strict';

const postsHandler = require('./posts-handler');
const util = require('./handler-util');

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
            util.handleLogout(req, res);
            break;
        default:
            break;
    }
}

module.exports = { route };
