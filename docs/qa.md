# QA 手順書

becky3.github.io は GitHub Pages で配信されており、`main` へのマージが即座に外部公開へ反映される。
レビュー通過は動作保証ではないため、PR マージ前に本手順で動作確認（QA）を行う。

`/auto-finalize` の品質ゲート Phase 3 が本ファイル（`docs/qa.md`）の存在を検出し、QA 実施確認をユーザーに発行する。

## 必須手順

PR マージ前に以下の 2 項目を実施する。どちらも欠かしてはならない。

### 1. ヘッドレススクリーンショット撮影

`tools/screenshot.sh` で全 6 時間帯（`?band=<id>`）のスクリーンショットを撮影し、変更箇所と未変更箇所を目視確認する。

```bash
tools/screenshot.sh \
  --names early-morning,forenoon,afternoon,evening,night,late-night \
  "https://becky3.github.io/?band=early-morning" \
  "https://becky3.github.io/?band=forenoon" \
  "https://becky3.github.io/?band=afternoon" \
  "https://becky3.github.io/?band=evening" \
  "https://becky3.github.io/?band=night" \
  "https://becky3.github.io/?band=late-night"
```

ローカル変更を確認する場合は `python -m http.server` で起動した URL（例: `http://localhost:8000/?band=evening`）を渡す。スクリプトのオプション詳細は [README.md「スクリーンショット撮影」](../README.md#スクリーンショット撮影) を参照。

確認観点:

- 変更対象の時間帯・要素が意図通りに表示されているか
- 変更対象外の時間帯・要素にデグレが発生していないか

### 2. ユーザーによる変更確認

ユーザー（becky）が実機または手元のブラウザで実際に変更を確認し、PR マージ前に承認する。

確認方法はユーザー判断（PC ブラウザ・スマホ実機・対象機能の操作等）。スクリーンショットでは検出できないインタラクション（タブ切替・ホバー・タップアニメ・キャッシュバスター動作等）の検証を含む。

`/auto-finalize` Phase 3 で「同一セッションで実施」「マージ後に別セッションで実施」のいずれかをユーザーが選択する。
