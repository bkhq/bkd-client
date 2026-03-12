# FEAT-002 隐藏 WebView 键盘辅助栏

- **status**: completed
- **priority**: P2
- **owner**: codex
- **createdAt**: 2026-03-12 21:10

## 描述

隐藏 iOS WebView 键盘上方的系统辅助栏，去掉上一项 / 下一项 / 完成按钮，减少页面内输入时的视觉干扰。

## 进行时描述

在 `react-native-webview` 上启用 `hideKeyboardAccessoryView`，并补充组件测试验证该 prop 已传入。

## 依赖

- **blocked by**: (无)
- **blocks**: (无)

## 笔记

已确认当前项目使用 `react-native-webview` / `WKWebView`，可通过官方 `hideKeyboardAccessoryView` prop 在 iOS 隐藏键盘辅助栏。
已运行 `npm test -- --runTestsByPath __tests__/components/WebViewScreen.test.tsx`，6 个测试全部通过。
