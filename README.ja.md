# 太陽光・蓄電池 投資回収＆償却ダッシュボード

[English](README.md) | 日本語

住宅用太陽光発電および蓄電池設備の投資回収（ROI）、自家消費による削減効果、売電収入、償却推移を可視化するクライアントサイド・ダッシュボードです。

## 概要

実際の電気料金請求データと太陽光発電実績から、正確な投資回収シミュレーションと月次経済効果を算出します。

- **自家消費による経済効果:** 毎月の電力会社昼間料金単価（`assumed_day_rate_jpy`）を用いて、電力会社からの買電を回避できた金額（節約効果）を正確に計算。固定基本料金による単価の歪みを防ぎます。
- **売電収入の直接計上:** 不定期な売電振込額を実績ベースで直接記録。
- **自家消費率のモニタリング:** 発電した太陽光エネルギーの自家消費率（%）を追跡し、自治体等の補助金交付要件（30%以上の自家消費基準など）の達成状況を可視化。
- **投資回収・償却進捗:** 実質初期費用（設備費用 − 補助金）に対する累積経済効果の進捗率（%）と損益分岐時期の予測を表示。

> **太陽光発電のみ（蓄電池なし）の場合:** 蓄電池を設置していない場合は、`web/data/config.json` の `"batteryCapacityKwh"` を `0` に設定してください。UIと表示項目が自動で太陽光単体向けに最適化されます。

---

## 計算ロジック・計算式

ダッシュボード内部で実行されている各種指標の計算式は以下の通りです。

### 1. 実質投資額（回収目標額）
```
実質投資額 = 設備総費用 - 受給補助金額
```
投資回収の基準となる初期投資の純負担額です。

### 2. 自家消費電力量 (kWh)
```
自家消費電力量 (kWh) = max(0, 発電電力量 - 売電電力量)
```
発電した電力のうち、売電されなかった分は家庭内で即時消費されたか、蓄電池に充電されて夜間に自家消費されたとみなします。

### 3. 月次自家消費削減効果額 (円)
```
削減効果額 (円) = 自家消費電力量 (kWh) * 昼間料金単価 (円/kWh)
```
買電量が極端に少ない月において基本料金による見かけ上の実効単価高騰を防ぐため、各月ごとに設定された昼間従量料金単価（`assumed_day_rate_jpy`）を用いて買電回避効果を計算します。

### 4. 月次合計経済効果 (円)
```
月次経済効果 (円) = 削減効果額 (円) + 売電振込額 (円)
```
自家消費による電気代削減効果と、電力会社から実際に口座へ振り込まれた売電収入の合計値です。

### 5. 累積回収額と回収進捗率
```
累積経済効果額 = 過去から現在までの月次経済効果の合計
回収進捗率 (%) = min(100%, (累積経済効果額 / 実質投資額) * 100)
回収残額 (円) = max(0, 実質投資額 - 累積経済効果額)
```

### 6. 回収完了（損益分岐）予測時期
```
月平均経済効果 = 直近12ヶ月の実績平均（TTM）
残り必要月数 = ceil(回収残額 / 月平均経済効果)
回収完了予測年月 = 最新記録年月 + 残り必要月数
```

### 7. 自家消費率 (%)
```
自家消費率 (%) = (自家消費電力量合計 / 発電電力量合計) * 100
```
発電した太陽光エネルギーをどの程度家庭内で有効活用できたかの割合を示し、補助金の自家消費要件（30%以上）の達成状況をリアルタイムに監視します。

---

## ご自身の太陽光設備で利用する場合（Fork手順）

本ツールをご自身の設備実績で利用したい場合は、本リポジトリをご自身のアカウントへ **Fork（複製）** してご利用ください。

1. **リポジトリを Fork:** 画面右上の **Fork** ボタンをクリックし、ご自身のアカウントにリポジトリを複製します。
2. **設定ファイルの編集 (`web/data/config.json`):**
   - 設備総費用、受給補助金額を入力します。
   - 設備容量（`solarCapacityKw`, `batteryCapacityKwh`, `inverterCapacityKw`）を入力します。
   - 表示言語（`"ja"` または `"en"`）や電力会社情報を入力します。
3. **実績データの入力 (`web/data/history.csv`):**
   - 毎月の買電量・電気料金請求額・発電量・売電量・売電振込額を入力します。
   - カラム構成: `month,grid_imported_kwh,bill_jpy,solar_generated_kwh,solar_exported_kwh,export_deposit_jpy,assumed_day_rate_jpy`
   - *※ `assumed_day_rate_jpy` について:* 太陽光発電がなかった場合に電力会社から買電していたであろう昼間の電気料金単価（基本昼間単価＋毎月の燃料費調整単価＋再エネ賦課金）を設定します。
4. **GitHub Pages で公開:**
   - リポジトリの **Settings** -> **Pages** を開きます。
   - **Build and deployment > Source** で **GitHub Actions** を選択します。
   - `main` ブランチへ push すると、自動的にテストが実行され `web/` ディレクトリのみが安全に公開されます。
   - `https://<ご自身のアカウント名>.github.io/<リポジトリ名>/` にて専用のダッシュボードが公開されます。

---

## 自動データ取得スクリプト (`fetch_solar.py`)

付属のPythonスクリプトを使用することで、各種データソースから毎月の実績を自動集約し、`web/data/history.csv` に反映できます。

1. **買電量・電気料金 (買電):**
   - **オクトパスエナジー（2026年11月以降）:** Kraken GraphQL API (`https://api.oejp-kraken.energy/v1/graphql/`) を叩き、30分ごとのスマートメーター実績 (`halfHourlyReadings`) を自動集約します。
   - **過去実績:** `--grid-import` および `--bill` 引数で指定可能です。
2. **太陽光発電量・CT計測売電電力量:**
   - ローカルの **VictoriaMetrics** からEP Cube蓄電池/太陽光、Canadian Solarパワコン、およびPanasonic主幹CTクランプの逆潮流電力量を日本時間（JST）の月境界で直接クエリします。
3. **売電収入（非FIT余剰売電）:**
   - `--tepco-export <ファイルパス>` で東京電力の月次売電明細CSVを指定すると、売電電力量および売電額を自動解析して取り込みます。

### 環境変数設定 (`.env`)

`.env.example` をコピーして `.env` を作成します（Git管理外）：

```bash
cp .env.example .env
```

認証情報および VictoriaMetrics エンドポイントを設定します：

```env
OCTOPUS_EMAIL="your-email@example.com"
OCTOPUS_PASSWORD="your-octopus-password"
OCTOPUS_ACCOUNT_NUMBER="A-XXXXXXXX"
VM_HOST="http://192.168.0.250:8428"
```

### スクリプトの実行方法

```bash
# 1. 前月分のデータを取得（ドライラン・プレビュー表示）
python3 fetch_solar.py

# 2. 特定の月（締め月、または当月の月初来・MTD）を取得
python3 fetch_solar.py 2026-11

# 3. 取得結果を web/data/history.csv に直接上書き・追記
python3 fetch_solar.py 2026-11 --append

# 4. 東電売電明細CSVファイルを指定して取り込み
python3 fetch_solar.py 2026-10 --append --tepco-export path/to/tepco_export.csv
```

### テストの実行

```bash
# Python取得スクリプトの単体テスト実行
python3 -m unittest discover -s tests -p "test_*.py"

# フロントエンドの計算モデルテスト実行 (macOS標準jsc または Node.js)
/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -m tests/model.test.mjs
```

---

## ディレクトリ構成

- `web/`: フロントエンド本体（GitHub Pagesで公開される唯一のディレクトリ）。
  - `web/index.html`: セマンティックなHTML構造。
  - `web/style.css`: ダークテーマCSS。
  - `web/js/`: ESモジュール（`main.js`, `model.js`, `view.js`, `charts.js`, `i18n.js`）。
  - `web/data/`: `config.json`, `history.csv`, `i18n.json`。
- `fetcher/`: データ取得用Pythonパッケージ（`config`, `window`, `vm`, `octopus`, `tepco`, `history`）。
- `fetch_solar.py`: fetcherパッケージを呼び出す薄いCLIエントリーポイント。
- `tests/`: 自動テスト群（計算ロジック、日付ウィンドウ、CSVパース）。
- `.github/workflows/deploy.yml`: テスト実行およびPages自動デプロイワークフロー。
