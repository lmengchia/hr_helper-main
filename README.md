<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8f372863-05ad-4a80-bd90-68608e16633e

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 專案建置與部署說明

本專案已完成以下設定：

### 1. 套件安裝與運行
確保已安裝 Node.js。執行以下指令安裝依賴並啟動專案：
```bash
npm install
npm run dev
```

### 2. GitHub Action 自動部署
已配置 `.github/workflows/deploy.yml`。
當程式碼推送到 `main` 或 `master` 分支時，會自動觸發 GitHub Actions 進行建置，並將 `dist` 資料夾的內容部署到 GitHub Pages。
*注意*：請至 GitHub 儲存庫的 **Settings > Pages** 確保 `Source` 設為 `GitHub Actions`。

### 3. Git 忽略檔案設定
`.gitignore` 已經過優化，會自動排除：
- `node_modules/` 與 `dist/` 等建置產物
- `.env` 隱私設定檔
- `*.log` 暫存檔與 IDE 相關系統檔
