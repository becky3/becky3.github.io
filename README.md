# becky3.github.io

becky のポートフォリオサイト。GitHub Pages で公開。

公開URL: <https://becky3.github.io/>

## ファイル構成

| ファイル / ディレクトリ | 説明 |
| --- | --- |
| `index.html` | エントリポイント。About / Experience / Works / Contact の4タブ構成 |
| `style.css` | スタイル定義（デザイントークン・時間帯演出・アバターアニメ含む） |
| `script.js` | タブ切替・アバター操作・時間帯判定・デバッグUI |
| `favicon.svg` | サイトアイコン |
| `tools/` | 開発補助スクリプト（サイト本体には含まれない） |

ビルドステップなし。HTML/CSS/JS をそのまま GitHub Pages から配信。

## 開発・運用ルール

- Git 運用: [Git 運用ルール](docs/git-workflow.md)（main 単独 + PR 必須）

### ドキュメント lint

- 設定ファイル: [`.markdownlint-cli2.jsonc`](.markdownlint-cli2.jsonc)
- ローカル実行: `npx markdownlint-cli2` または `/doc-lint` スキル
- CI / pre-commit での自動実行は設定していない

### スクリーンショット撮影

ヘッドレス Chrome で任意の URL を撮影する汎用スクリプト。UI 試行錯誤時の繰り返し作業を想定。
本サイト固有のロジックは持たないため、他プロジェクトでも流用可能。

- スクリプト: [`tools/screenshot.sh`](tools/screenshot.sh)
- 前提: Google Chrome または Chromium がインストール済みであること。Bash 実行環境（Windows では Git Bash 等）

Chrome 実行ファイルは `CHROME` 環境変数 / `PATH` / Windows 既定インストール先 / macOS 既定インストール先の順で自動検出する。検出に失敗した場合は `--chrome <PATH>` で明示指定する。

#### 使い方

```bash
# 単発撮影 → .tmp/screenshots/<yyyyMMdd_HHmmss>.png
tools/screenshot.sh https://becky3.github.io/

# ファイル名指定 → .tmp/screenshots/homepage.png
tools/screenshot.sh --name homepage https://becky3.github.io/

# 一括撮影（時間帯 6 種）→ .tmp/screenshots/<timestamp>_<name>.png
tools/screenshot.sh \
  --names early-morning,forenoon,afternoon,evening,night,late-night \
  "https://becky3.github.io/?band=early-morning" \
  "https://becky3.github.io/?band=forenoon" \
  "https://becky3.github.io/?band=afternoon" \
  "https://becky3.github.io/?band=evening" \
  "https://becky3.github.io/?band=night" \
  "https://becky3.github.io/?band=late-night"
```

#### オプション

| オプション | 既定値 | 説明 |
| --- | --- | --- |
| `-o`, `--output-dir <DIR>` | `.tmp/screenshots` | 出力ディレクトリ |
| `-n`, `--name <NAME>` | timestamp | 単発撮影時のファイル名（拡張子なし）。`[A-Za-z0-9._-]` のみ許可。複数 URL 時はエラー |
| `--names <N1,N2,...>` | （連番） | 一括撮影時のファイル名サフィックス。URL 数と一致 + 重複禁止。文字制約は `--name` と同じ |
| `-w`, `--viewport <WxH>` | `1280x800` | ビューポートサイズ |
| `-t`, `--virtual-time-budget <MS>` | `4000` | フォント・画像読み込み待機 ms |
| `--no-sandbox` | 無効 | Chrome に `--no-sandbox` を付与（Linux / CI 環境向け、opt-in） |
| `--chrome <PATH>` | 自動検出 | Chrome 実行ファイルパス（`CHROME` 環境変数も可） |

ファイル名規則:

| モード | 既定 | `--name` / `--names` 指定時 |
| --- | --- | --- |
| 単発 (URL 1 件) | `<timestamp>.png` | `<NAME>.png` |
| 一括 (URL N 件) | `<timestamp>_<index>.png`（1 始まり） | `<timestamp>_<NAME>.png` |

timestamp フォーマット: `yyyyMMdd_HHmmss`。

一括撮影は fail-fast。1 件失敗した時点で残りの URL は撮影せずに終了する。撮影済みファイルはそのまま残る。

## 演出

### 時間帯連動ヘッダー

アクセス時刻に応じてヘッダー背景・装飾要素を6パターン切替する。1分ごとに再判定。

| 時間帯 | 範囲 | 装飾 |
| --- | --- | --- |
| 早朝 | 5-9時 | 朝焼けピンク〜オレンジ + 朝もや + ピンク雲 + 低めの淡オレンジの太陽 + 鳥のシルエット |
| 午前 | 9-12時 | 淡い水色 + 白い雲 + 高い位置の明るい黄色の太陽 |
| 午後 | 12-17時 | 鮮やかな青空 + 白い雲 + 中段の淡オレンジの太陽 |
| 夕方 | 17-19時 | 夕焼けグラデ + ピンク雲 + 夕焼け染め + 低めの深紅の太陽 + 鳥のシルエット |
| 夜 | 19-23時 | 紺紫グラデ + 月（金色）+ 星のきらめき |
| 深夜 | 23-5時 | 黒に近い濃紺 + 月（銀色）+ 星 |

`prefers-reduced-motion: reduce` を有効にしている環境では雲・鳥・星のアニメーションを停止。

### アバター

| 操作 | 効果 |
| --- | --- |
| 待機 | リング（カラフルな縁）が常時回転、4秒ごとにウィンク（左右クイック振動） |
| ホバー（PC） | Z軸360°回転（cubic-bezier overshoot） |
| タップ（スマホ） | Z軸360°回転 |

## デバッグ機能

時間帯演出の動作確認用。本番では非表示。

### 表示方法

| 方法 | 永続性 |
| --- | --- |
| URL に `?debug=1` を付与 | URLパラメータ依存（リロードしても付いていれば有効） |
| フッター「© becky / Rhythmcan」を **800ms 以内に3連タップ** | リロードで解除（in-memory のみ） |

有効化すると右下に時間帯切替パネルが出現。`◀` / `▶` で時間帯を順送り、`auto` で現在時刻判定に戻る。

### 撮影・検証用パラメータ

`?band=<id>` で初期表示の時間帯を強制指定する。
`<id>` は `early-morning` / `forenoon` / `afternoon` / `evening` / `night` / `late-night`。

例: <https://becky3.github.io/?band=night>
