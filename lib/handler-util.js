'use strict';

/**
 * 401を返し、テキストをレスポンスに書き込む関数
 * @param {*} req リクエスト
 * @param {*} res レスポンス
 */
function handleLogout(req, res) {
    res.writeHead(401, {
        'Content-Type': 'text/plains; charset=utf-8'
    });
    res.end('ログアウトしました');
}

/**
 * テキストともに404を返す関数
 * @param {*} req リクエスト
 * @param {*} res レスポンス
 */
function handleNotFound(req, res) {
    res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8'
    });
    res.end('ページがみつかりません');
}

module.exports = { handleLogout, handleNotFound };
