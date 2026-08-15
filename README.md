# ir-ext

https://github.com/user-attachments/assets/5c34a2ed-3a7c-45bb-8ddd-1a606d0d75cc

A browser extension for incremental reading of web pages, supporting one-click bookmark update, and supporting saving and scrolling to the text position of the last stay.

一个浏览器扩展，用于增量阅读网页，支持一键更新书签，支持存储并滚动到上一次停留的文本位置。

## WXT + React

This template should help get you started developing with React in WXT.

## 发布过程
第一次需要用 `bun wxt submit init` 初始化配置文件 .env.submit
里面需要填写好需要的key

开发完之后

更新 package.json 中的 version

`bun wxt zip -b firefox` 编译结果，chrome 不用 -b firefox

执行命令提交到 Firefox 商店
```bash
bun run wxt-publish-extension --firefox-zip .output/ir-ext-0.0.17-firefox.zip --firefox-sources-zip .output/ir-ext-0.0.17-sources.zip
```