# OIDC SSO 技術解説

## OIDC (OpenID Connect) とは

OIDC は OAuth 2.0 を拡張した認証プロトコル。OAuth 2.0 が「認可 (Authorization)」のプロトコルであるのに対し、OIDC は「認証 (Authentication)」の仕組みを追加している。

### 登場人物

| 用語                        | 説明                                          | このサンプルでは         |
| --------------------------- | --------------------------------------------- | ------------------------ |
| **RP (Relying Party)**      | サービス提供者。ユーザー認証を IdP に委譲する | Next.js アプリ           |
| **IdP (Identity Provider)** | 認証を行う。ユーザーの ID を管理する          | Keycloak                 |
| **End User**                | サービスを利用するユーザー                    | ブラウザでアクセスする人 |

---

## OIDC 認証フロー (Authorization Code Flow)

このサンプルでは最も一般的な **Authorization Code Flow** を使用している。

```
┌──────────┐                              ┌──────────┐                              ┌──────────┐
│          │                              │          │                              │          │
│  ブラウザ │                              │  Next.js │                              │ Keycloak │
│          │                              │   (RP)   │                              │  (IdP)   │
└────┬─────┘                              └────┬─────┘                              └────┬─────┘
     │                                         │                                         │
     │  1. Sign in クリック                    │                                         │
     │ ───────────────────────────────────────>│                                         │
     │                                         │                                         │
     │  2. 302 Redirect to Keycloak            │                                         │
     │ <───────────────────────────────────────│                                         │
     │                                         │                                         │
     │  3. Authorization Request               │                                         │
     │ ─────────────────────────────────────────────────────────────────────────────────>│
     │     GET /realms/test-realm/protocol/openid-connect/auth                           │
     │     ?client_id=nextjs-app                                                         │
     │     &redirect_uri=http://localhost:3000/api/auth/callback/keycloak                │
     │     &response_type=code                                                           │
     │     &scope=openid profile email                                                   │
     │     &state=xxx                                                                    │
     │                                         │                                         │
     │  4. ログイン画面表示                     │                                         │
     │ <─────────────────────────────────────────────────────────────────────────────────│
     │                                         │                                         │
     │  5. ユーザー認証 (ID/PW入力)             │                                         │
     │ ─────────────────────────────────────────────────────────────────────────────────>│
     │                                         │                                         │
     │  6. 302 Redirect with Authorization Code │                                        │
     │ <─────────────────────────────────────────────────────────────────────────────────│
     │     Location: http://localhost:3000/api/auth/callback/keycloak                    │
     │               ?code=AUTHORIZATION_CODE                                            │
     │               &state=xxx                                                          │
     │                                         │                                         │
     │  7. Callback with code                  │                                         │
     │ ───────────────────────────────────────>│                                         │
     │                                         │                                         │
     │                                         │  8. Token Request (server-to-server)    │
     │                                         │ ───────────────────────────────────────>│
     │                                         │     POST /realms/test-realm/protocol/   │
     │                                         │          openid-connect/token           │
     │                                         │     grant_type=authorization_code       │
     │                                         │     code=AUTHORIZATION_CODE             │
     │                                         │     client_id=nextjs-app                │
     │                                         │     client_secret=xxxxx                 │
     │                                         │                                         │
     │                                         │  9. Token Response                      │
     │                                         │ <───────────────────────────────────────│
     │                                         │     { access_token, id_token,           │
     │                                         │       refresh_token }                   │
     │                                         │                                         │
     │                                         │  10. ID Token 検証 & セッション作成      │
     │                                         │ ────────┐                               │
     │                                         │         │                               │
     │                                         │ <───────┘                               │
     │                                         │                                         │
     │  11. Set-Cookie & Redirect to /         │                                         │
     │ <───────────────────────────────────────│                                         │
     │                                         │                                         │
     │  12. ログイン完了、セッション情報表示    │                                         │
     │ <───────────────────────────────────────│                                         │
     │                                         │                                         │
```

### 各ステップの解説

| Step  | 説明                                                                                               |
| ----- | -------------------------------------------------------------------------------------------------- |
| 1-2   | ユーザーが Sign in をクリック。RP は IdP の認可エンドポイントへリダイレクト                        |
| 3     | **Authorization Request**: RP が IdP に認証を要求。`client_id`, `redirect_uri`, `scope` などを指定 |
| 4-5   | IdP がログイン画面を表示し、ユーザーが認証                                                         |
| 6     | 認証成功後、IdP は **Authorization Code** を付けて RP にリダイレクト                               |
| 7     | RP のコールバック URL に code が届く                                                               |
| 8-9   | **Token Request**: RP がサーバーサイドで code を Token に交換。`client_secret` を使用              |
| 10    | RP が **ID Token** を検証し、ユーザー情報を取得。セッションを作成                                  |
| 11-12 | セッション Cookie をセットしてログイン完了                                                         |

---

## トークンの種類

OIDC では3種類のトークンが発行される:

| トークン          | 用途                                                        | 有効期限            |
| ----------------- | ----------------------------------------------------------- | ------------------- |
| **ID Token**      | ユーザーの認証情報 (JWT)。RP がユーザーを識別するために使用 | 短い (数分〜数時間) |
| **Access Token**  | API アクセス用。リソースサーバーに対する認可                | 短い (数分〜数時間) |
| **Refresh Token** | 新しい Access Token / ID Token を取得するため               | 長い (数日〜数週間) |

### ID Token (JWT) の構造

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-id"
  },
  "payload": {
    "iss": "http://localhost:8080/realms/test-realm", // 発行者 (IdP)
    "sub": "user-uuid", // ユーザー識別子
    "aud": "nextjs-app", // 対象者 (RP の client_id)
    "exp": 1234567890, // 有効期限
    "iat": 1234567800, // 発行時刻
    "auth_time": 1234567800, // 認証時刻
    "nonce": "random-nonce", // リプレイ攻撃防止
    "name": "Test User", // ユーザー名
    "email": "testuser@example.com" // メールアドレス
  },
  "signature": "..."
}
```

---

## IdP (Keycloak) 側の設定

### Realm

Keycloak では **Realm** という単位でユーザーやクライアントを管理する。このサンプルでは `test-realm` を使用。

### Client 設定

`keycloak/realm-export.json` で設定している内容:

```json
{
  "clientId": "nextjs-app", // クライアント識別子
  "enabled": true,
  "publicClient": false, // Confidential Client (secret 必須)
  "secret": "nextjs-app-secret", // クライアントシークレット
  "redirectUris": [
    "http://localhost:3000/*" // 許可するリダイレクト先
  ],
  "webOrigins": [
    "http://localhost:3000" // CORS 許可オリジン
  ],
  "standardFlowEnabled": true, // Authorization Code Flow を有効化
  "protocol": "openid-connect"
}
```

### 重要な設定項目

| 設定           | 説明                                                          |
| -------------- | ------------------------------------------------------------- |
| `clientId`     | RP を識別する ID。Authorization Request で使用                |
| `secret`       | RP がトークンを取得する際の認証に使用。**絶対に公開しない**   |
| `redirectUris` | 認証後のリダイレクト先。セキュリティ上、厳密に設定する        |
| `publicClient` | `false` = Confidential Client。サーバーサイドで secret を使用 |

---

## RP (Next.js + Auth.js) 側の設定

### 環境変数 (`.env.local`)

```bash
# Keycloak クライアント設定
KEYCLOAK_ID=nextjs-app                              # Client ID
KEYCLOAK_SECRET=nextjs-app-secret                   # Client Secret
KEYCLOAK_ISSUER=http://localhost:8080/realms/test-realm  # IdP の Issuer URL

# Auth.js 設定
AUTH_SECRET=...   # セッション暗号化用のシークレット
AUTH_URL=http://localhost:3000  # アプリの URL
```

### Auth.js 設定 (`src/auth.ts`)

```typescript
import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_ID,
      clientSecret: process.env.KEYCLOAK_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
  ],
});
```

### Auth.js が自動で行うこと

Auth.js の Keycloak プロバイダーは、以下を自動で処理する:

1. **OIDC Discovery**
   - `{issuer}/.well-known/openid-configuration` から IdP のエンドポイント情報を取得
   - Authorization Endpoint, Token Endpoint, UserInfo Endpoint, JWKS URI など

2. **Authorization Request の構築**
   - `/api/auth/signin/keycloak` にアクセスすると、適切なパラメータで IdP にリダイレクト

3. **Callback 処理**
   - `/api/auth/callback/keycloak` で Authorization Code を受け取る
   - サーバーサイドで Token Endpoint に POST して Token を取得

4. **ID Token の検証**
   - JWKS (JSON Web Key Set) を使って署名を検証
   - `iss`, `aud`, `exp` などの claim を検証

5. **セッション管理**
   - JWT または Database でセッションを管理
   - Cookie にセッション情報を保存

### エンドポイント一覧

Auth.js が自動で作成するエンドポイント:

| パス                          | 用途                            |
| ----------------------------- | ------------------------------- |
| `/api/auth/signin`            | サインインページ                |
| `/api/auth/signin/keycloak`   | Keycloak へのリダイレクト開始   |
| `/api/auth/callback/keycloak` | Keycloak からのコールバック受付 |
| `/api/auth/signout`           | サインアウト                    |
| `/api/auth/session`           | 現在のセッション情報 (JSON)     |

---

## OIDC Discovery

IdP は `.well-known/openid-configuration` で設定情報を公開している。

```bash
curl http://localhost:8080/realms/test-realm/.well-known/openid-configuration | jq
```

主要なエンドポイント:

```json
{
  "issuer": "http://localhost:8080/realms/test-realm",
  "authorization_endpoint": "http://localhost:8080/realms/test-realm/protocol/openid-connect/auth",
  "token_endpoint": "http://localhost:8080/realms/test-realm/protocol/openid-connect/token",
  "userinfo_endpoint": "http://localhost:8080/realms/test-realm/protocol/openid-connect/userinfo",
  "jwks_uri": "http://localhost:8080/realms/test-realm/protocol/openid-connect/certs",
  "end_session_endpoint": "http://localhost:8080/realms/test-realm/protocol/openid-connect/logout"
}
```

---

## SP・IdP が必要とする情報

OIDC 認証を成立させるために、SP（RP）と IdP はそれぞれ相手の情報を事前に知っている必要がある。

### SP（RP）が必要とする情報

| 情報                   | 取得方法       | 使用タイミング | 説明                                      |
| ---------------------- | -------------- | -------------- | ----------------------------------------- |
| **issuer URL**         | 事前設定       | 全体           | IdP の識別子。OIDC Discovery の起点となる |
| **client_id**          | 事前設定       | ステップ 3, 8  | IdP に登録した SP の識別子                |
| **client_secret**      | 事前設定       | ステップ 8     | IdP に登録した SP の秘密鍵                |
| authorization_endpoint | OIDC Discovery | ステップ 3     | 認可リクエストの送信先 URL                |
| token_endpoint         | OIDC Discovery | ステップ 8     | トークンリクエストの送信先 URL            |
| jwks_uri               | OIDC Discovery | ステップ 10    | ID Token 署名検証用の公開鍵取得先         |
| userinfo_endpoint      | OIDC Discovery | 任意           | ユーザー情報の追加取得先                  |
| end_session_endpoint   | OIDC Discovery | ログアウト時   | IdP 側のセッション終了用                  |

**ポイント**: SP が事前に設定するのは `issuer`, `client_id`, `client_secret` の 3 つだけ。他のエンドポイント URL は OIDC Discovery で自動取得される。

### IdP が必要とする情報

| 情報                           | 設定方法         | 使用タイミング | 説明                                               |
| ------------------------------ | ---------------- | -------------- | -------------------------------------------------- |
| **client_id**                  | クライアント登録 | ステップ 3, 8  | SP の識別子                                        |
| **client_secret**              | クライアント登録 | ステップ 8     | SP が本物か検証するための秘密鍵                    |
| **redirect_uri（許可リスト）** | クライアント登録 | ステップ 3, 6  | 認可コードを返すリダイレクト先の許可リスト         |
| allowed_scopes                 | クライアント登録 | ステップ 3     | SP に許可するスコープ（openid, profile, email 等） |

### 各ステップでの検証と使用する情報

```
ステップ 3: Authorization Request
──────────────────────────────────────────────────────
ブラウザ → IdP

SP が使う情報:
  - authorization_endpoint（Discovery で取得）
  - client_id（事前設定）

IdP が検証:
  ✅ client_id が登録済みか
  ✅ redirect_uri が許可リストに含まれるか
  ✅ scope が許可されているか


ステップ 6: Authorization Code 発行
──────────────────────────────────────────────────────
IdP → ブラウザ → SP

IdP が使う情報:
  - redirect_uri（許可リストと照合済み）

IdP は事前登録された redirect_uri にのみリダイレクトする
→ オープンリダイレクト攻撃の防止


ステップ 8: Token Request
──────────────────────────────────────────────────────
SP → IdP（サーバー間通信）

SP が使う情報:
  - token_endpoint（Discovery で取得）
  - client_id（事前設定）
  - client_secret（事前設定）

IdP が検証:
  ✅ client_id + client_secret の組み合わせが正しいか
  ✅ authorization_code が有効か（未使用・期限内）
  ✅ redirect_uri がステップ 3 と同じか


ステップ 10: ID Token 検証
──────────────────────────────────────────────────────
SP 内部処理

SP が使う情報:
  - jwks_uri から取得した公開鍵
  - issuer（事前設定、iss クレームとの照合）
  - client_id（aud クレームとの照合）

SP が検証:
  ✅ 署名が正しいか（公開鍵で検証）
  ✅ iss が期待する IdP か
  ✅ aud が自分の client_id か
  ✅ exp が期限内か
  ✅ nonce がリクエスト時と一致するか
```

### OIDC Discovery の仕組み

SP は `{issuer}/.well-known/openid-configuration` にアクセスするだけで、必要なエンドポイント情報を自動取得できる。

```
SP の設定: issuer URL のみ
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│  GET {issuer}/.well-known/openid-configuration          │
└─────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│  {                                                      │
│    "issuer": "https://...",                             │
│    "authorization_endpoint": "https://.../auth",        │
│    "token_endpoint": "https://.../token",               │
│    "jwks_uri": "https://.../certs",                     │
│    "userinfo_endpoint": "https://.../userinfo",         │
│    ...                                                  │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
              │
              ├──> authorization_endpoint → ステップ 3 で使用
              ├──> token_endpoint         → ステップ 8 で使用
              ├──> jwks_uri               → ステップ 10 で使用
              └──> userinfo_endpoint      → 追加情報取得時に使用
```

### 信頼関係の確立

```
┌─────────────────────────────────────────────────────────────────────┐
│                        事前の信頼関係構築                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   IdP 側で SP を登録                 SP 側で IdP を設定             │
│   ─────────────────                 ─────────────────               │
│   ・client_id 発行                   ・issuer URL 設定              │
│   ・client_secret 発行               ・client_id 設定               │
│   ・redirect_uri 登録                ・client_secret 設定           │
│                                                                     │
│         │                                   │                       │
│         └─────────────┬─────────────────────┘                       │
│                       ▼                                             │
│              相互に相手を識別・検証できる状態                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

認証フロー中の検証:
  IdP → SP を検証: client_id + client_secret で「本物の SP か」確認
  SP → IdP を検証: ID Token の署名を公開鍵で検証し「本物の IdP が発行したか」確認
```

---

## セキュリティ考慮事項

### 1. Client Secret の保護

- `KEYCLOAK_SECRET` は絶対に公開しない
- サーバーサイドでのみ使用する (Authorization Code Flow)

### 2. State パラメータ

- CSRF 攻撃を防ぐため、Auth.js は自動で `state` パラメータを生成・検証

### 3. PKCE (Proof Key for Code Exchange)

- Authorization Code の横取りを防ぐ追加のセキュリティ機構
- Auth.js は自動で PKCE を使用

### 4. Redirect URI の検証

- IdP 側で許可された `redirect_uri` のみ受け付ける
- ワイルドカードの使用は最小限に

### 5. Token の有効期限

- ID Token / Access Token は短い有効期限にする
- Refresh Token で更新するか、再認証を要求

---

## トラブルシューティング

### よくあるエラー

| エラー                  | 原因                                            | 対処                                            |
| ----------------------- | ----------------------------------------------- | ----------------------------------------------- |
| `invalid_client`        | Client ID または Secret が間違っている          | `.env.local` と Keycloak の設定を確認           |
| `redirect_uri_mismatch` | Redirect URI が許可リストにない                 | Keycloak の Client 設定で `redirectUris` を確認 |
| `invalid_grant`         | Authorization Code が期限切れまたは既に使用済み | 再度ログインフローを開始                        |

### デバッグ方法

1. **ブラウザの Network タブ**
   - リダイレクトのパラメータを確認
   - Token Request のレスポンスを確認

2. **Keycloak のログ**

   ```bash
   make idp-logs
   ```

3. **Session 情報の確認**
   ```bash
   curl http://localhost:3000/api/auth/session
   ```
