# EAS Update Guide

## Project Info

| Item | Value |
|------|-------|
| EAS Project ID | `5a903f10-5f45-481d-ac8d-29b1cff59222` |
| EAS Slug | `bitk` |
| EAS Account | `bithk` |
| Dashboard | https://expo.dev/accounts/bithk/projects/bitk |
| Runtime Version Policy | `appVersion` (currently `1.0.0`) |

## Channels

| Channel | Profile | Purpose |
|---------|---------|---------|
| `development` | development | Dev client builds |
| `development-simulator` | development-simulator | iOS simulator builds |
| `preview` | preview | Internal testing (TestFlight) |
| `production` | production | App Store release |

## OTA Update (JS-only changes)

OTA updates push JS bundle changes to devices without rebuilding the native binary. Only works when the `runtimeVersion` has not changed.

### Publish an update

```bash
# iOS only, preview channel
eas update --channel preview \
  --message "description of the change" \
  --environment preview \
  --platform ios \
  --non-interactive

# Both platforms
eas update --channel preview \
  --message "description of the change" \
  --environment preview \
  --non-interactive
```

### List updates on a branch

```bash
eas update:list --branch preview --non-interactive --json
```

### Delete an update group

```bash
eas update:delete <update-group-id> --non-interactive
```

### Replace an existing update

Delete the old one first, then publish a new one:

```bash
# 1. Get group ID
GROUP_ID=$(eas update:list --branch preview --non-interactive --json \
  | jq -r '.currentPage[0].group')

# 2. Delete
eas update:delete "$GROUP_ID" --non-interactive

# 3. Publish new
eas update --channel preview \
  --message "new description" \
  --environment preview \
  --platform ios \
  --non-interactive
```

## Native Build

Required when native code or config changes (new plugins, SDK upgrade, `runtimeVersion` bump).

```bash
# Preview build (internal distribution)
eas build --profile preview --platform ios

# Production build
eas build --profile production --platform ios
```

## Auth

Token stored at `/work/tokens/expo.env`:

```bash
# Load token
export EXPO_TOKEN=$(grep -oP 'TOKEN=\K.*' /work/tokens/expo.env)

# Or inline with a command
EXPO_TOKEN=$(grep -oP 'TOKEN=\K.*' /work/tokens/expo.env) eas update ...
```

Manage tokens at https://expo.dev/accounts/bithk/settings/access-tokens.

## When OTA vs Native Build

| Change Type | OTA Update | Native Build |
|-------------|:----------:|:------------:|
| JS/TS code changes | YES | - |
| Style changes | YES | - |
| Asset changes (images) | YES | - |
| New native module / plugin | - | YES |
| Expo SDK upgrade | - | YES |
| `app.json` native config change | - | YES |
| `runtimeVersion` bump | - | YES |
