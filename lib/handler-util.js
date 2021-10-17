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

module.exports = { handleLogout };
