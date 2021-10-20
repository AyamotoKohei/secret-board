'use strict';
const pug = require('pug');
const Post = require('./post');
const Cookies = require('cookies');
const util = require('./handler-util');

// Day.jsライブラリの読込と設定
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc)
dayjs.extend(timezone)

const trackingIdKey = 'tracking_id';

/**
 * アクセス処理を行う関数
 * @param {*} req リクエスト
 * @param {*} res レスポンス
 */
function handle(req, res) {
    // Cookieをモジュールとして読込、addTrackingCookieを呼び出す
    const cookies = new Cookies(req, res);
    addTrackingCookie(cookies);

    switch (req.method) {
        case 'GET':
            res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8'
            });
            // 投稿内容を取得する
            Post.findAll({order:[['id', 'DESC']]}).then((posts) => {
                // データベースから取得した投稿内容の改行を行う
                posts.forEach(post => {
                    // 改行コードがあれば置き換える
                    // post.content = post.content.replace(/\n/g, '<br>');

                    // 日本時間にフォーマット
                    post.formattedCreatedAt = dayjs(post.createdAt)
                    .tz('Asia/Tokyo')
                    .format('YYYY年MM年DD月 HH時mm分ss秒');
                });
                res.end(pug.renderFile('./views/posts.pug', { posts, user: req.user }));

                // ログ出力
                console.info( 
                    `閲覧されました: user: ${req.user}, ` +
                    `trackingId: ${cookies.get(trackingIdKey)} ` +
                    `remoteAddress: ${req.socket.remoteAddress}, ` +
                    `userAgent: ${req.headers['user-agent']}`
                );
            });
            break;
        case 'POST':
            let body = [];
            // リクエストでdataとendを受け取った際の処理
            req.on('data', (chunk) => {
                body.push(chunk);
            }).on('end', () => {
                // 受け取ったデータを文字列に変換
                body = Buffer.concat(body).toString(); 

                // decodedをURLSearchParamsの形式に変換
                const params = new URLSearchParams(body);

                // キーの値を取得
                const content = params.get('content');

                // ログを出力し、関数を呼び出す
                console.info(`投稿されました: ${content}`);

                // データベース上にデータを作成
                Post.create({
                    content,
                    trackingCookie: cookies.get(trackingIdKey), // Cookieの値をDBに保存
                    postedBy: req.user
                }).then(() => {
                    handleRedirectPosts(req, res);
                });
            });
            break;
        default:
            util.handleBadRequest(req, res);
            break;
    }
}

/**
 * 投稿内容を削除する処理を行う関数
 * @param {Object} req リクエスト
 * @param {Object} res レスポンス
 */
function handleDelete(req, res) {
    switch (req.method) {
        case 'POST':
            // POSTのデータを受け取る
            let body = [];
            req.on('data', (chunk) => {
                body.push(chunk);
            }).on('end', () => {
                // URLエンコードをデコード
                body = Buffer.concat(body).toString();
                const params = new URLSearchParams(body);

                // 投稿のIDを取得
                const id = params.get('id');

                // 削除処理
                Post.findByPk(id).then((post) => { // IDを使って投稿を取得、できたら無名関数を実行
                    if (req.user === post.postedBy || req.user === 'admin') { // ユーザ本人、または管理者が削除を実行しようとしていることを確認
                        post.destroy().then(() => { // 削除を実行
                            // 削除時にログを出力
                            console.info(
                                `削除されました: user: ${req.user}, ` +
                                `remoteAddress: ${req.socket.remoteAddress}, ` +
                                `userAgent: ${req.headers['user-agent']} `
                            );
                            handleRedirectPosts(req, res); // リダイレクト
                        });
                    }
                });
            });
            break;
        default:
            util.handleBadRequest(req, res);
            break;
    }
}

/**
 * トラッキングIDがない時、それを設定する関数
 * @param {Object} cookies Cookie
 */
function addTrackingCookie(cookies) {
    if (!cookies.get(trackingIdKey)) {
        // ランダムな整数値を生成して、トラッキングIDとする
        const trackingId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

        // Dateオブジェクトの生成
        const tomorrow = new Date(Date.now() + (1000 * 60 * 60 * 24));

        // 24時間後に有効期限が切れるように、Cookieを設定
        cookies.set(trackingIdKey, trackingId, { expires: tomorrow });
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

module.exports = { handle, handleDelete };