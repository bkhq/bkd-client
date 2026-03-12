# BKD Client — 变更日志

## 2026-03-12 21:25 [progress]

完成 FEAT-002: 隐藏 iOS WebView 键盘辅助栏。
- 在 `WebViewScreen` 中启用 `hideKeyboardAccessoryView`
- 隐藏 iOS 键盘上的上一项 / 下一项 / 完成工具栏
- 补充组件测试，验证 `WebView` 已传入该 prop

## 2026-03-04 00:55 [progress]

初始化 PMA 项目管理结构。

## 2026-03-04 01:45 [progress]

完成 FEAT-001: Expo SDK 55 + WebView 客户端应用搭建。
- 技术栈: Expo SDK 55, expo-router, react-native-webview, expo-sqlite
- TDD 开发: 43 个测试全部通过，覆盖率 93.82%
- 功能: 服务器增删改查、HTTP 探测、沉浸式 WebView、顶部工具栏（刷新+下拉菜单）
- CI: GitHub Actions + EAS Build (Android/iOS)
- E2E: Maestro flows (add/delete/open-webview)
