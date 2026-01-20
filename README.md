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

## 将来展望: 他の IdP への対応

このサンプルは Keycloak を IdP として使用しているが、OIDC 準拠の IdP であれば設定変更のみで切り替え可能。

### 対応可能な IdP 例

| IdP | Auth.js プロバイダー |
|-----|---------------------|
| Microsoft Entra ID (Azure AD) | `microsoft-entra-id` |
| Google | `google` |
| Okta | `okta` |
| Auth0 | `auth0` |

### Entra ID への切り替え例

1. **環境変数の変更** (`.env.local`)

```bash
AUTH_MICROSOFT_ENTRA_ID_ID=<Application (client) ID>
AUTH_MICROSOFT_ENTRA_ID_SECRET=<Client Secret>
AUTH_MICROSOFT_ENTRA_ID_ISSUER=https://login.microsoftonline.com/<Tenant ID>/v2.0
```

2. **Auth.js 設定の変更** (`src/auth.ts`)

```typescript
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
  ],
});
```

3. **signIn 呼び出しの変更**

```typescript
await signIn("microsoft-entra-id");
```

OIDC が標準プロトコルであるため、IdP を変更してもアプリケーション側の変更は最小限で済む。
