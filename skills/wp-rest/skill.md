---
name: wp-rest
description: WordPress REST APIを使って投稿・固定ページ・メディア・カテゴリ・タグを管理するCLIスキル
triggers:
  - "WordPress"
  - "WP投稿"
  - "ブログ投稿"
  - "記事を投稿"
  - "記事を公開"
  - "WordPressに投稿"
  - "下書き"
  - "固定ページ"
  - "メディアアップロード"
  - "カテゴリ"
  - "タグ"
---

# WordPress REST API CLI スキル (wp-rest-cli)

あなたはWordPress REST APIを操作するCLIツール `wp-rest-cli` のエキスパートです。
ユーザーの指示に従い、適切なコマンドを組み立てて実行してください。

## 前提条件

- `wp-rest-cli` がグローバルインストール済み (`npm install -g wp-rest-cli`)
- プロファイルが設定済みであること

## プロファイル設定

プロファイルが未設定の場合は、以下の手順でセットアップを案内してください:

```bash
# プロファイル追加（パスワードはプロンプトで入力）
wp-rest config add <name> --url https://example.com --user <username>

# プロファイル一覧
wp-rest config list

# デフォルトプロファイル切替
wp-rest config use <name>

# プロファイル削除
wp-rest config remove <name>

# 設定ディレクトリの場所
wp-rest config path
```

認証にはWordPressのアプリケーションパスワードを使用します。
WordPress管理画面 > ユーザー > プロフィール > アプリケーションパスワード で発行できます。

## コマンド一覧

### 投稿 (post)

```bash
# 一覧表示
wp-rest post list [--status <status>] [--per-page <n>] [--page <n>] [--search <term>] [--category <id>] [--tag <id>] [--format json]

# 個別取得
wp-rest post get <id> [--format json]

# 新規作成
wp-rest post create --title "タイトル" [--content "本文HTML"] [--content-file ./article.html] [--status draft|publish|pending|private] [--categories 1,2] [--tags 3,4] [--thumbnail <mediaId>] [--excerpt "抜粋"] [--slug "slug"]

# 更新
wp-rest post update <id> [--title "新タイトル"] [--content "新本文"] [--content-file ./updated.html] [--status publish] [--categories 1,2] [--tags 3,4] [--thumbnail <mediaId>]

# 削除（ゴミ箱へ）
wp-rest post delete <id>

# 完全削除
wp-rest post delete <id> --force
```

### 固定ページ (page)

```bash
# 一覧表示
wp-rest page list [--status <status>] [--per-page <n>] [--search <term>] [--format json]

# 個別取得
wp-rest page get <id>

# 新規作成
wp-rest page create --title "ページタイトル" [--content "本文"] [--content-file ./page.html] [--status draft|publish] [--parent <id>] [--order <n>] [--thumbnail <mediaId>] [--slug "slug"]

# 更新
wp-rest page update <id> [--title "新タイトル"] [--content "新本文"]

# 削除
wp-rest page delete <id> [--force]
```

### メディア (media)

```bash
# 一覧表示
wp-rest media list [--per-page <n>] [--search <term>] [--mime-type image/jpeg] [--format json]

# アップロード
wp-rest media upload ./image.jpg [--title "画像タイトル"]

# 削除（メディアは常に完全削除）
wp-rest media delete <id>
```

### カテゴリ (category)

```bash
# 一覧表示
wp-rest category list [--per-page <n>] [--search <term>] [--format json]

# 新規作成
wp-rest category create --name "カテゴリ名" [--slug "slug"] [--description "説明"] [--parent <id>]

# 削除
wp-rest category delete <id>
```

### タグ (tag)

```bash
# 一覧表示
wp-rest tag list [--per-page <n>] [--search <term>] [--format json]

# 新規作成
wp-rest tag create --name "タグ名" [--slug "slug"] [--description "説明"]

# 削除
wp-rest tag delete <id>
```

## 共通オプション

| オプション | 説明 |
|---|---|
| `--profile <name>` | 使用するプロファイルを指定（省略時はデフォルト） |
| `--format json` | JSON形式で出力（デフォルトはテーブル形式） |

## 実行フロー

1. ユーザーの意図を理解する（投稿作成？一覧確認？メディアアップロード？）
2. 必要な情報が不足していれば質問する（タイトル、本文、ステータスなど）
3. 適切なコマンドを組み立てる
4. Bashツールで実行し、結果をユーザーに報告する

## よくあるワークフロー

### 記事を書いて公開する

```bash
# 1. カテゴリ確認
wp-rest category list

# 2. タグ確認
wp-rest tag list

# 3. 画像をアップロード（サムネイル用）
wp-rest media upload ./thumbnail.jpg --title "記事サムネイル"

# 4. 下書き作成
wp-rest post create --title "記事タイトル" --content-file ./article.html --categories 5 --tags 10,11 --thumbnail 123 --status draft

# 5. 確認して公開
wp-rest post update <id> --status publish
```

### HTMLファイルから本文を投稿する

本文が長い場合は `--content-file` オプションでファイルから読み込めます:

```bash
# HTMLファイルを作成してから投稿
wp-rest post create --title "タイトル" --content-file ./content.html --status draft
```

## 注意事項

- `--content` にはHTML文字列を渡します。マークダウンは非対応です
- 長い本文は `--content-file` でファイルから読み込むことを推奨します
- カテゴリ・タグはID指定です。名前から探す場合は先に `list` で確認してください
- メディアの削除は常に完全削除（ゴミ箱なし）です
- 設定ファイルは `~/.wp-rest-cli/` に保存されます
- パスワードはAES-256-CBCで暗号化して保存されます
