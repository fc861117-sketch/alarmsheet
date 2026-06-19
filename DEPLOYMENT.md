# GitHub Pages 與即時線上更新設計

## 建議架構

本系統後續可部署成：

- GitHub：保存程式碼。
- GitHub Pages：發布網站。
- Firebase Firestore：保存申請資料、受理人員名單，並提供即時同步。

GitHub Pages 只適合放靜態網頁，不能直接保存多人資料。若要多位承辦人同時使用、資料即時更新，需要外接雲端資料庫。

## 使用流程

1. 承辦人打開 GitHub Pages 網址。
2. 新增或編輯申請資料。
3. 資料寫入 Firestore。
4. 其他已開啟網頁的承辦人會即時看到更新。
5. CSV / JSON 匯出仍保留，作為統計與備份。

## 資料集合設計

### `applications`

每一筆申請資料一筆文件。

欄位：

- `date`
- `serial`
- `name`
- `gender`
- `birth`
- `nationalId`
- `phone`
- `address`
- `homeStatus`
- `receiveMethod`
- `installLocation`
- `personTypes`
- `housingType`
- `certificateNo`
- `handler`
- `status`
- `note`
- `updatedAt`

### `settings/handlers`

受理人員名單。

欄位：

- `names`: 字串陣列
- `updatedAt`

## 權限建議

正式上線不建議完全公開寫入。建議使用 Firebase Authentication：

- 只允許登入者讀寫。
- 帳號可用 Google 登入或電子郵件登入。
- Firestore 規則限制未登入者不能讀寫。

初期測試可先用簡化規則，但正式使用前一定要改成登入制。

## 程式調整方向

目前版本使用瀏覽器本機儲存，適合單機或試用。要改成即時線上版時，建議新增資料層：

- `localStorageAdapter`：目前本機儲存。
- `firestoreAdapter`：Firebase 即時同步。

畫面操作不直接碰資料庫，而是呼叫資料層：

- `listenRecords(callback)`
- `saveRecord(record)`
- `deleteRecord(id)`
- `listenHandlers(callback)`
- `saveHandlers(names)`

這樣可先維持離線版可用，日後切換 Firebase 不需要重寫整個畫面。

## 推到 GitHub 前檢查

- 確認 `index.html`、`styles.css`、`app.js` 可直接開啟。
- 若加入 Firebase，Firebase 設定檔不可放私人金鑰。
- 前端 Firebase config 可以公開，但安全性必須靠 Firestore Rules 與登入權限。
- 不要把民眾個資匯出的 JSON / CSV 推上 GitHub。

## 建議下一步

1. 先把目前離線版推到 GitHub，開 GitHub Pages。
2. 建立 Firebase 專案。
3. 加入登入功能。
4. 將資料儲存從 localStorage 改成 Firestore。
5. 測試兩台電腦同時開啟是否即時同步。
