# BKD 发布指南

## 项目信息

| 项目 | 值 |
|------|-------|
| EAS Project ID | `5a903f10-5f45-481d-ac8d-29b1cff59222` |
| EAS Slug | `bitk` |
| EAS Account | `bithk` |
| Dashboard | https://expo.dev/accounts/bithk/projects/bitk |
| Runtime Version | `appVersion` (当前 `1.0.0`) |
| Bundle ID (iOS) | `io.bk.bkd` |
| Package (Android) | `io.bk.bkd` |
| 官网 | `bkd.bk.io` |

## 发布渠道

| 渠道 | Profile | 用途 |
|---------|---------|---------|
| `development` | development | 开发客户端 |
| `preview` | preview | 内部测试 (OTA) |
| `production` | production | 正式发布 (APK + Ad-Hoc IPA) |
| `production-store` | production-store | 应用商店 (AAB + App Store IPA) |

---

## 一、OTA 更新（JS 变更）

仅推送 JS bundle 到设备，不重新编译原生代码。仅当 `runtimeVersion` 未变时有效。

### 认证

Token 存放在 `/work/tokens/expo.env`：

```bash
# 加载 token
export EXPO_TOKEN=$(grep -oP 'TOKEN=\K.*' /work/tokens/expo.env)

# 或内联使用
EXPO_TOKEN=$(grep -oP 'TOKEN=\K.*' /work/tokens/expo.env) eas update ...
```

管理 token：https://expo.dev/accounts/bithk/settings/access-tokens

### 发布更新

```bash
# iOS，preview 渠道
eas update --channel preview \
  --message "变更描述" \
  --environment preview \
  --platform ios \
  --non-interactive

# 全平台
eas update --channel preview \
  --message "变更描述" \
  --environment preview \
  --non-interactive
```

### 查看更新

```bash
eas update:list --branch preview --non-interactive --json
```

### 删除更新

```bash
eas update:delete <update-group-id> --non-interactive
```

### 替换更新

```bash
# 1. 获取 group ID
GROUP_ID=$(eas update:list --branch preview --non-interactive --json \
  | jq -r '.currentPage[0].group')

# 2. 删除旧版
eas update:delete "$GROUP_ID" --non-interactive

# 3. 发布新版
eas update --channel preview \
  --message "新描述" \
  --environment preview \
  --platform ios \
  --non-interactive
```

---

## 二、产品化发布（GitHub Actions）

通过 Git tag 触发自动构建，不依赖 EAS Build。

### 架构

```
git tag v1.0.0 → GitHub Actions
    ├── test (ubuntu)
    ├── build-android (ubuntu): prebuild → Gradle → APK
    ├── build-ios (macos-15): prebuild → Xcode → IPA
    └── deploy:
         ├── upload APK/IPA → Cloudflare R2 (bkd-releases)
         └── deploy 官网 → Cloudflare Workers (bkd.bk.io)
```

### 触发发布

```bash
# 方式一：推 tag 自动触发
git tag v1.0.0
git push origin v1.0.0

# 方式二：手动触发（GitHub Actions → Release → Run workflow）
# 填入版本号和平台
```

### 所需 GitHub Secrets

| Secret | 用途 | 来源 |
|--------|------|------|
| `EXPO_TOKEN` | EAS CLI 认证 | `/work/tokens/expo.env` |
| `CLOUDFLARE_API_TOKEN` | Wrangler CLI 认证 | Cloudflare Dashboard → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID | Cloudflare Dashboard → Overview |
| `P12_BASE64` | iOS 签名证书 | `base64 -i cert.p12` |
| `P12_PASSWORD` | 证书密码 | 创建证书时设置 |
| `PROVISIONING_PROFILE_BASE64` | iOS Ad-Hoc 描述文件 | Apple Developer → Profiles |
| `APPLE_TEAM_ID` | Apple 开发者团队 ID | Apple Developer → Membership |
| `ANDROID_KEYSTORE_BASE64` | Android 签名 keystore | `base64 -i bkd-release.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore 密码 | 生成时设置 |
| `ANDROID_KEY_ALIAS` | Key alias | `bkd` |
| `ANDROID_KEY_PASSWORD` | Key 密码 | 生成时设置 |

### 生成 Android Keystore

```bash
./scripts/generate-keystore.sh
```

按提示输入密码，然后 base64 编码后存入 GitHub Secrets。

---

## 三、官网（bkd.bk.io）

Cloudflare Worker 托管的落地页，提供 APK/IPA 下载。

### 路由

| 路径 | 功能 |
|------|------|
| `/` | 落地页（下载入口） |
| `/download/android` | 从 R2 流式下载 APK |
| `/download/ios` | 触发 iOS itms-services 安装 |
| `/download/ios/manifest.plist` | iOS OTA 安装清单 |
| `/download/ios/artifact` | IPA 文件流 |
| `/api/version` | 当前版本 JSON |

### R2 存储结构

```
bkd-releases/
  ├── latest.json              # 版本元数据
  ├── icon.png                 # 应用图标
  ├── android/
  │   └── bkd-v1.0.0.apk
  └── ios/
      └── bkd-v1.0.0.ipa
```

`latest.json` 格式：

```json
{
  "version": "1.0.0",
  "date": "2026-03-15",
  "android_url": "android/bkd-v1.0.0.apk",
  "ios_url": "ios/bkd-v1.0.0.ipa"
}
```

### 本地开发

```bash
cd website
npm install
npm run dev
```

### 手动部署官网

```bash
cd website
npm run deploy:production
```

### Cloudflare 配置

1. **R2 桶**：创建名为 `bkd-releases` 的桶
2. **DNS**：在 `bk.io` 域名下添加 `bkd` CNAME 指向 Worker
3. **Workers Route**：`bkd.bk.io/*` → `bkd-website` Worker

```bash
# 创建 R2 桶
wrangler r2 bucket create bkd-releases

# 上传应用图标
wrangler r2 object put bkd-releases/icon.png --file assets/images/icon.png
```

---

## 四、OTA vs 原生构建

| 变更类型 | OTA 更新 | 原生构建 |
|-------------|:----------:|:------------:|
| JS/TS 代码 | YES | - |
| 样式变更 | YES | - |
| 图片资源 | YES | - |
| 新原生模块/插件 | - | YES |
| Expo SDK 升级 | - | YES |
| `app.json` 原生配置 | - | YES |
| `runtimeVersion` 变更 | - | YES |

---

## 五、iOS 分发说明

当前使用 **Ad-Hoc** 分发，限制：

- 最多 100 台注册设备
- 需在 Apple Developer 注册设备 UDID
- 用户通过 Safari 打开下载链接安装

后续可迁移至：
- **TestFlight** — 无设备数限制，需 App Store Connect
- **App Store** — 正式上架，使用 `production-store` profile
