#!/usr/bin/env node
/**
 * Version management script
 *
 * Usage:
 *   node scripts/version.mjs patch       # 1.0.0 → 1.0.1 (bug fix, new native build)
 *   node scripts/version.mjs minor       # 1.0.0 → 1.1.0 (new feature, new native build)
 *   node scripts/version.mjs major       # 1.0.0 → 2.0.0 (breaking change, new native build)
 *   node scripts/version.mjs ota         # bump build number only (JS hot update)
 *   node scripts/version.mjs sync        # sync version.json → app.json + package.json
 *   node scripts/version.mjs show        # show current versions
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const versionPath = resolve(root, "version.json");
const appJsonPath = resolve(root, "app.json");
const packagePath = resolve(root, "package.json");

function read(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function write(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

function bumpSemver(version, type) {
  const [major, minor, patch] = version.split(".").map(Number);
  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Unknown bump type: ${type}`);
  }
}

const command = process.argv[2];
const ver = read(versionPath);

switch (command) {
  case "patch":
  case "minor":
  case "major": {
    const newVersion = bumpSemver(ver.version, command);
    ver.version = newVersion;
    ver.runtimeVersion = newVersion; // native change → new runtime version
    ver.build = 1;
    write(versionPath, ver);
    syncToAppJson(ver);
    console.log(`${command}: ${ver.version} (runtime: ${ver.runtimeVersion}, build: ${ver.build})`);
    console.log("Native code changed → requires new APK/IPA build");
    break;
  }

  case "ota": {
    ver.build += 1;
    write(versionPath, ver);
    syncToAppJson(ver);
    console.log(`ota: ${ver.version} build ${ver.build} (runtime: ${ver.runtimeVersion})`);
    console.log("JS only → OTA hot update");
    break;
  }

  case "sync": {
    syncToAppJson(ver);
    console.log("Synced version.json → app.json + package.json");
    console.log(`  version: ${ver.version}, runtime: ${ver.runtimeVersion}, build: ${ver.build}`);
    break;
  }

  case "show": {
    console.log(`version:        ${ver.version}`);
    console.log(`runtimeVersion: ${ver.runtimeVersion}`);
    console.log(`build:          ${ver.build}`);
    break;
  }

  default:
    console.error("Usage: node scripts/version.mjs [patch|minor|major|ota|sync|show]");
    process.exit(1);
}

function syncToAppJson(v) {
  // Update app.json
  const appJson = read(appJsonPath);
  appJson.expo.version = v.version;
  appJson.expo.runtimeVersion = v.runtimeVersion;
  write(appJsonPath, appJson);

  // Update package.json version
  const pkg = read(packagePath);
  pkg.version = v.version;
  write(packagePath, pkg);
}
