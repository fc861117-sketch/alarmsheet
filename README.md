# 湖口分隊住警器紀錄系統

用於住宅用火災警報器補助申請建檔、清冊彙整、表單列印與資料匯出。

## 功能

- 申請資料新增、編輯、刪除
- 人員類別複選、住宅類別單選
- 受理人員名單管理
- 住宅類別統計彙整
- 補助申請表列印
- 簽收清冊列印
- CSV 匯出供統計使用
- JSON 匯出與匯入供備份使用
- 以一組共用帳號密碼登入後才能使用系統
- 透過 Google Apps Script 同步資料到 Google Sheet

## 使用方式

直接用瀏覽器開啟 `index.html` 即可使用。

首次使用會要求設定一組共用帳號與密碼，之後開啟系統需登入才可使用。

目前資料會同步送到 Google Sheet，瀏覽器本機也會保留快取。若網路或 Apps Script 暫時失敗，系統會先保存本機資料並提示同步失敗。

登入成功後，系統會每 10 秒從 Google Sheet 重新讀取資料一次；切回網頁時也會自動同步，因此多台裝置會接近即時更新目前發放狀況。

## Google Sheet 同步設定

1. 開啟目標 Google Sheet。
2. 選擇「擴充功能」→「Apps Script」。
3. 將 `APPS_SCRIPT_CODE.gs` 內容貼入 Apps Script。
4. 部署為 Web App。
5. 權限建議：
   - 執行身分：我
   - 存取權：任何知道連結的人
6. 將 Web App URL 以 Base64 分段方式填入 `app.js` 的 `CLOUD_API_PARTS`。

注意：前端 URL 混淆不是完整資安防護，瀏覽器執行時仍會還原 URL。系統安全主要依賴 Apps Script 端的共用帳號密碼驗證。

若其他裝置無法用同一組帳號密碼登入，請確認 Apps Script 已貼上最新版 `APPS_SCRIPT_CODE.gs`，並且已重新部署 Web App。

若帳號是在早期本機版設定，請先用原本那台裝置開啟最新版網站一次。系統會自動把本機帳號同步到 GAS，之後其他裝置即可用同一組登入。

忘記密碼或想重新設定時，請在 Apps Script 專案設定的 Script Properties 刪除 `sharedUsername` 與 `sharedPasswordHash`，再重新開網站設定。

## GitHub Pages

此專案是靜態網頁，可放到 GitHub Pages。

部署後入口檔案：

- `index.html`

## 即時線上同步

若要多人同時使用並即時同步資料，GitHub Pages 需搭配雲端資料庫，例如 Firebase Firestore。

詳細設計見：

- `DEPLOYMENT.md`

## 注意

不要將民眾個資的 CSV 或 JSON 備份檔上傳到 GitHub。
