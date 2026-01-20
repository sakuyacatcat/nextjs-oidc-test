# Next.js + Keycloak OIDC SSO Sample

Next.js (App Router) + Auth.js + Keycloak で OIDC SSO を検証するサンプル。

## 構成

| コンポーネント | 役割                         | URL                   |
| -------------- | ---------------------------- | --------------------- |
| Next.js        | サービス (RP: Relying Party) | http://localhost:3000 |
| Keycloak       | IdP (Identity Provider)      | http://localhost:8080 |

## セットアップ

### 1. 依存関係インストール

```bash
make install
```

### 2. Keycloak 起動

```bash
make idp-up
```

Keycloak が起動するまで待つ（初回は数十秒かかる）:

```bash
make idp-logs
# "Running the server" が表示されたら準備完了
```

### 3. Next.js 起動

```bash
make run
```

## 動作確認

### ログインフロー

1. http://localhost:3000 にアクセス
2. 「Sign in」ボタンをクリック
3. Keycloak のログイン画面にリダイレクト
4. テストユーザーでログイン
   - Username: `testuser`
   - Password: `password`
5. Next.js にリダイレクトされ、セッション情報が表示される

### 保護されたページ

- http://localhost:3000/protected
- 未ログイン時は自動的にログイン画面へリダイレクト

### Keycloak 管理画面

- URL: http://localhost:8080
- Admin: `admin` / `admin`
- Realm: `test-realm`
- Client: `nextjs-app`

## Makefile コマンド

```bash
make install     # 依存関係インストール
make run         # 開発サーバー起動
make build       # ビルド
make idp-up      # Keycloak 起動
make idp-down    # Keycloak 停止
make idp-logs    # Keycloak ログ確認
make clean       # node_modules, .next 削除
```

## ファイル構成

```
.
├── compose.yml                         # Keycloak コンテナ定義
├── keycloak/
│   └── realm-export.json               # Realm/Client/User 設定
├── .env.local                          # 環境変数
├── src/
│   ├── auth.ts                         # Auth.js 設定
│   ├── app/
│   │   ├── page.tsx                    # ホームページ
│   │   ├── protected/
│   │   │   └── page.tsx                # 認証必須ページ
│   │   └── api/auth/[...nextauth]/
│   │       └── route.ts                # Auth.js API ルート
│   └── components/
│       └── auth-button.tsx             # ログイン/ログアウトボタン
└── Makefile
```

## 技術詳細

[development.md](./development.md) を参照。
