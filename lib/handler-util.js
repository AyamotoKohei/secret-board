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

/**
 * テキストともに400を返す関数
 * @param {*} req 
 * @param {*} res 
 */
function handleBadRequest(req, res) {
    res.writeHead(400, {
        'Content-Type': 'text/plain; charset=utf-8'
    });
    res.end('未対応のメソッドです')
}

module.exports = { handleLogout, handleNotFound, handleBadRequest };
