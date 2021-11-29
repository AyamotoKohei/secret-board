# secret-board

## 詳細
N予備校の「【2021年度】プログラミング入門」の第3章で開発したWebサイトの『秘密の匿名掲示板』です。<br>
アクセスする際に配布された ID と パスワードによる認証を必要とし、管理人が決めたユーザたちだけが利用できる匿名掲示板です。

## URL(Herokuで公開)
https://glacial-brook-92628.herokuapp.com/posts

## 学習期間
2021年10月16日〜2021年10月24日

## バージョン
### Docker
```
$ docker -v
Docker version 20.10.8, build 3967b7d
```
### Node.js
```
$ node -v
v14.15.4
```

### yarn
```
$ yarn -v
1.22.5
```

## 開発環境の実行方法、及び終了方法
+ 実行
```
$ pwd
/Users/AyamotoKohei/secret-board

$ mkdir ../secret-board-db

$ docker-compose up -d

$ docker-compose exec app bash

$ yarn install

$ PORT=8000 yarn start
```

+ 実行終了
```
$ exit

$ docker-compose down
```
