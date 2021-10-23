'use strict';
/**
 * モジュールの読み込みを行う
 */
const { Sequelize, DataTypes } = require('sequelize');

/**
 * データベースと接続する際に必要なオプションを定義する
 */
const dialectOptions = {
    ssl: {
        require: true,
        rejectUnauthorized: false
    }
};

/**
 * DBの設定を渡し、掲示板を表すデータベースのオブジェクトを作成する
 */
const sequelize = process.env.DATABASE_URL ? 
    // 本番環境
    new Sequelize(
        process.env.DATABASE_URL,
        {
            // ログの設定を全てオフ
            logging: false,
            dialectOptions
        }
    )
    :
    // 開発環境
    new Sequelize (
        'postgres://postgres:postgres@db/secret_board',
        {
            // ログの設定を全てオフ
            logging: false
        }
    );

/**
 * sequelizeの形式に従って記述し、オブジェクトとして定義する
 */
const Post = sequelize.define(
    'Post', {
        id: { // 固有のIDを設定し、それが固有であるかどうかをチェックするprimaryKeyを設定
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        content: { // 投稿内容
            type: DataTypes.TEXT
        },
        postedBy: { // 投稿したユーザ名
            type: DataTypes.STRING
        },
        trackingCookie: { // ユーザごとに付与するCookieを保存する
            type: DataTypes.STRING
        }
    },
    {
        freezeTableName: true, // データを保存する領域の名前を固定
        timestamps: true // 更新日時を自動的に追加
    }
);

// オブジェクトをデータベースに適用する
Post.sync();

// モジュールとして公開
module.exports = Post;