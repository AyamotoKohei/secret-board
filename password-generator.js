'use strict';

// パスワードの長さ
const length = 12;

// パスワードに使う文字の候補
const charset = 'abcdefghijklmnopqrstuvwxyz' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + '0123456789';

/**
 * 指定した長さのパスワードを作成する関数
 * @returns 
 */
function passwordGenerator() {
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }

    // 正規表現を利用して、3種類の文字が使われていることを確認
    const includeAllType = /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password);

    // 3種類の文字が使われていなければ、もう一度関数を実行
    return includeAllType ? password : passwordGenerator();
}

console.log(passwordGenerator());