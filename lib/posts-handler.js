'use strict';
// ハッシュ関数のためのcryptoモジュールを読み込む
const crypto = require('crypto');

const pug = require('pug');
const Post = require('./post');
const Cookies = require('cookies');
const util = require('./handler-util');

// Day.jsライブラリの読込と設定
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { parse } = require('path');
dayjs.extend(utc)
dayjs.extend(timezone)

const trackingIdKey = 'tracking_id';

// キーをユーザー名、値をトークンとする連想配列
const oneTimeTokenMap = new Map();

/**
 * アクセス処理を行う関数
 * @param {Object} req リクエスト
 * @param {Object} res レスポンス
 */
function handle(req, res) {
    // Cookieをモジュールとして読込、addTrackingCookieから戻り値を得る
    const cookies = new Cookies(req, res);
    const trackingId = addTrackingCookie(cookies, req.user);

    switch (req.method) {
        case 'GET':
            res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8'
            });
            // 投稿内容を取得する
            Post.findAll({order:[['id', 'DESC']]}).then((posts) => {
                // データベースから取得した投稿内容の改行を行う
                posts.forEach(post => {
                    // 日本時間にフォーマット
                    post.formattedCreatedAt = dayjs(post.createdAt).tz('Asia/Tokyo').format('YYYY年MM年DD月 HH時mm分ss秒');
                });

                // HTTPのGETメソッドで、フォームをテンプレートで表示させる
                const oneTimeToken = crypto.randomBytes(8).toString('hex'); // トークンの作成
                oneTimeTokenMap.set(req.user, oneTimeToken); // 連想配列に保存
                res.end(pug.renderFile('./views/posts.pug', { 
                    posts, 
                    user: req.user,
                    oneTimeToken 
                }));

                // ログ出力
                console.info( 
                    `閲覧されました: user: ${req.user}, ` +
                    `trackingId: ${trackingId}, ` +
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
                
                // トークンの値を取得
                const requestedOneTimeToken = params.get('oneTimeToken');

                // どちらかの値がはいっていないかキー名が間違っているかを判定
                if (!(content && requestedOneTimeToken)) {
                    // 400のステータスコードを返す
                    util.handleBadRequest(req, res);
                } else {
                    // 連想配列に格納されているワンタイムパスワードとリクエスとされたワンタイムトークンが
                    // 一致するかどうかを判定する
                    if (oneTimeTokenMap.get(req.user) === requestedOneTimeToken) {
                        // ログを出力し、関数を呼び出す
                        console.info(`投稿されました: ${content}`);

                        // データベース上にデータを作成
                        Post.create({
                            content,
                            trackingCookie: trackingId, // Cookieの値をDBに保存
                            postedBy: req.user
                        }).then(() => {
                            oneTimeTokenMap.delete(req.user); // 利用済みのトークンを削除
                            handleRedirectPosts(req, res);
                        });
                    } else {
                        // トークンが正しくないとき、400のステータスコードを返す
                        util.handleBadRequest(req, res);
                    }
                }
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
 * Cookieに含まれているトラッキングIDに異常がなければその値を返し、
 * 存在しない場合や異常なものである場合には、再度作成しCookieに付与してその値を返す
 * @param {Cookies} cookies Cookie
 * @param {String} userName ユーザー名
 * @returns {String} トラッキングID
 */
function addTrackingCookie(cookies, userName) {
    // Cookieからリクエストに含まれたトラッキングIDを取得
    const requestedTrackingId = cookies.get(trackingIdKey);

    // リクエストされたトラッキングIDがユーザー名として正しいか検証
    if (isValidTrackingId(requestedTrackingId, userName)) {
        // 正しければそのままトラッキングIDを返す
        return requestedTrackingId;
    } else {
        // ランダムな整数値を生成して、トラッキングIDとする
        const originalId = parseInt(crypto.randomBytes(8).toString('hex'), 16);

        // Dateオブジェクトの生成
        const tomorrow = new Date(Date.now() + (1000 * 60 * 60 *24));
        
        // 「元々のID」と「元のIDとユーザー名を利用して作られたハッシュ値」を組み合わせた値
        const trackingId = `${originalId}_${createValidHash(originalId, userName)}`;
        
        // 24時間後に有効期限が切れるように、Cookieを設定
        cookies.set(trackingIdKey, trackingId, { expires: tomorrow });

        return trackingId;
    }
}

/**
 * トラッキングIDとユーザー名からそのトラッキングIDが正しいことを検証する関数
 * @param {String} trackingId トラッキングID
 * @param {String} userName ユーザー名
 * @returns {Boolean} 真偽値
 */
function isValidTrackingId (trackingId, userName) {
    // トラッキングIDの値がfalsyな値かどうか検証
    if (!trackingId) {
        return false;
    }

    // トラッキングIDをアンダーバーで分割
    const splitted = trackingId.split('_');

    // 作成したハッシュ値と送られてきたハッシュ値が同じか、正当な値であるかを検証
    const originalId = splitted[0];
    const requestedHash = splitted[1];
    return createValidHash(originalId, userName) === requestedHash;
}

// 秘密鍵となる文字列を宣言
const secretKey =
  '5a69bb55532235125986a0df24aca759f69bae045c7a66d6e2bc4652e3efb43da4' +
  'd1256ca5ac705b9cf0eb2c6abb4adb78cba82f20596985c5216647ec218e84905a' +
  '9f668a6d3090653b3be84d46a7a4578194764d8306541c0411cb23fbdbd611b5e0' +
  'cd8fca86980a91d68dc05a3ac5fb52f16b33a6f3260c5a5eb88ffaee07774fe2c0' +
  '825c42fbba7c909e937a9f947d90ded280bb18f5b43659d6fa0521dbc72ecc9b4b' +
  'a7d958360c810dbd94bbfcfd80d0966e90906df302a870cdbffe655145cc4155a2' +
  '0d0d019b67899a912e0892630c0386829aa2c1f1237bf4f63d73711117410c2fc5' +
  '0c1472e87ecd6844d0805cd97c0ea8bbfbda507293beebc5d9';

/**
 * SHA-1アルゴリズムを利用して、元々のトラッキングIDとユーザー名を結合した
 * 文字列に対してメッセージダイジェストを作成する関数
 * @param {String} originalId トラッキングID
 * @param {String} userName ユーザー名
 * @returns {String} メッセージダイジェスト
 */
function createValidHash(originalId, userName) {
    const sha1sum = crypto.createHash('sha1');
    sha1sum.update(originalId + userName + secretKey); // 最後に秘密鍵を結合
    return sha1sum.digest('hex');
}

/**
 * リダイレクトをハンドリングする関数
 * @param {Object} req リクエスト
 * @param {Object} res レスポンス
 */
function handleRedirectPosts(req, res) {
    // 303: POSTでアクセスした際に、処理の後、GETでも同じパスにアクセスし直す 
    res.writeHead(303, {
        'Location': '/posts'
    });
    res.end();
}

module.exports = { handle, handleDelete };