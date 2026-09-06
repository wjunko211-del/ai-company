# ai-company

Claude API と対話できる複数のAI社員(CEO/エンジニア/デザイナー/マーケター)とチャットできる社内ダッシュボードアプリです。Next.js (App Router) + `@anthropic-ai/sdk` で構築しています。

## セットアップ

```bash
npm install
```

`ANTHROPIC_API_KEY` 環境変数に Claude API キーを設定してください(このリポジトリの Claude Code 環境ではすでに設定済みです)。

## 起動

```bash
npm run dev
```

http://localhost:3000 で開きます。画面右上のステータス表示で Claude API への接続確認ができます。

## API

- `POST /api/chat` — `{ agentId, messages }` を送るとエージェントの応答を返します。
- `GET /api/health` — Claude API への接続確認用のヘルスチェックです。

## デプロイ

このアプリはサーバー側で `ANTHROPIC_API_KEY` を使うため、Vercel など Node.js が動くホスティングへのデプロイが必要です。デプロイ先の環境変数に `ANTHROPIC_API_KEY` を設定してください。
