# Belajar（インドネシア語学習アプリ）

PWA対応のインドネシア語学習アプリです。単語/文章/クイズ/ミニゲーム、さらにGemini APIを使ったAI生成・高度翻訳を備えています。

## 事前準備

- Node.js（推奨: 18+）
- （AI機能を使う場合のみ）環境変数 `GEMINI_API_KEY`

## ローカル起動（提出用）

### 1. インストール
```bash
npm install
```

### 2. 開発モード起動
```bash
npm run dev
```
ブラウザで `http://localhost:5000` を開きます（`PORT` を指定する場合は環境変数で変更できます）。

### 3. 本番ビルドして起動
```bash
npm run build
npm start
```

## スマホ（Android/iPhone）での見え方（PWA）

- iPhoneのノッチ/ホームバー対策として `viewport-fit=cover` と safe-area を反映しています。
- 端末で開いて「ホーム画面に追加」するとアプリ風に使えます（ブラウザの機能によります）。

## AI機能について

- `AdvancedTranslate` や `AI Word/Sentences` などはサーバー側で Gemini を呼び出します。
- `GEMINI_API_KEY` が未設定の場合、該当機能はエラーになります。

## ネイティブアプリ化（Capacitor）

このリポジトリは Capacitor 対応済みです。`android/` と `ios/` プロジェクトを生成済みなので、以下で同期とIDE起動ができます。

### 1. Web資産を同期
```bash
npm run cap:sync
```

### 2. Android Studio / Xcode を開く
```bash
npm run cap:open:android
npm run cap:open:ios
```

### 3. 審査提出前チェック（必須）
- アプリID / バンドルID（現状: `com.belajarindonesian.app`）を本番用に確定
- スプラッシュ / アイコン / スクリーンショットをストア要件に合わせて設定
- プライバシーポリシーURLとサポート連絡先を用意
- AI機能の説明文（生成結果の注意書き）をストア説明に記載
- iOS: `App Privacy`、Android: `Data safety` の回答を実態どおり入力

