BUN := bun

.PHONY: install dev build start lint idp-up idp-down idp-logs clean

# 依存関係インストール
install:
	$(BUN) install

# 開発サーバー起動
run:
	$(BUN) run dev

# ビルド
build:
	$(BUN) run build

# 本番サーバー起動
start:
	$(BUN) run start

# Lint
lint:
	$(BUN) run lint

# IdP (Keycloak) 起動
idp-up:
	docker compose up -d

# IdP 停止
idp-down:
	docker compose down

# IdP ログ確認
idp-logs:
	docker compose logs -f

# クリーンアップ
clean:
	rm -rf node_modules .next
