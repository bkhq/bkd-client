const { execSync } = require("child_process");

// Get git commit hash at build/export time
let commitHash = "dev";
try {
  commitHash = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
} catch {
  // fallback for CI or environments without git
}

// Read version info
let versionInfo = { version: "1.0.0", runtimeVersion: "1.0.0", build: 1 };
try {
  versionInfo = require("./version.json");
} catch {
  // fallback
}

// Load base config from app.json
const appJson = require("./app.json");

module.exports = {
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    commitHash,
    buildNumber: versionInfo.build,
  },
};
