# PWA 圖示生成指南

## 需要的圖示尺寸
- `icon-192x192.png` (192x192 像素)
- `icon-512x512.png` (512x512 像素)

## 快速生成方法

### 方法 1: 使用線上工具（推薦）
訪問 https://realfavicongenerator.net/ 或 https://www.pwabuilder.com/imageGenerator
上傳你的 logo 或設計圖，自動生成所有尺寸

### 方法 2: 使用 ImageMagick（如果已安裝）
```bash
# 從你的 logo 生成 PWA 圖示
convert your-logo.png -resize 192x192 icon-192x192.png
convert your-logo.png -resize 512x512 icon-512x512.png
```

### 方法 3: 使用 Figma/Sketch/Photoshop
1. 建立 512x512 的設計
2. 匯出為 PNG
3. 複製並調整為 192x192

## 暫時方案
目前已建立 icon.svg 作為參考設計（紫色背景 + "阿" 字）
可以用這個作為基礎修改成你喜歡的設計

## 放置位置
圖示應放在：
- `/web/public/icon-192x192.png`
- `/web/public/icon-512x512.png`
