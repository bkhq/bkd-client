import { renderLanding, type VersionInfo, type ReleaseFile } from "./templates/landing";
import { renderManifest } from "./templates/manifest";

interface Env {
  RELEASES: R2Bucket;
}

const BUNDLE_ID = "io.ns.bkd";
const APP_TITLE = "BKD";
const CACHE_TTL = 60; // seconds

async function getLatestInfo(bucket: R2Bucket): Promise<VersionInfo | null> {
  const obj = await bucket.get("latest.json");
  if (!obj) return null;
  try {
    return (await obj.json()) as VersionInfo;
  } catch {
    return null;
  }
}

async function listReleases(bucket: R2Bucket): Promise<ReleaseFile[]> {
  const files: ReleaseFile[] = [];
  const androidList = await bucket.list({ prefix: "android/" });
  for (const obj of androidList.objects) {
    const match = obj.key.match(/bkd-v(.+)\.apk$/);
    if (match) {
      files.push({
        version: match[1],
        platform: "android",
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded.toISOString().slice(0, 10),
      });
    }
  }
  const iosList = await bucket.list({ prefix: "ios/" });
  for (const obj of iosList.objects) {
    const match = obj.key.match(/bkd-v(.+)\.ipa$/);
    if (match) {
      files.push({
        version: match[1],
        platform: "ios",
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded.toISOString().slice(0, 10),
      });
    }
  }
  return files;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ===== OTA Update Helpers =====

interface UpdateMetadata {
  version: number;
  bundler: string;
  fileMetadata: {
    android: {
      bundle: string;
      assets: Array<{ path: string; ext: string }>;
    };
    ios: {
      bundle: string;
      assets: Array<{ path: string; ext: string }>;
    };
  };
}

const EXT_TO_MIME: Record<string, string> = {
  ".bundle": "application/javascript",
  ".js": "application/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function generateUUID(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hex = [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // Format as UUID: 8-4-4-4-12
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

async function handleOTAManifest(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const platform = request.headers.get("expo-platform") ?? "";
  const runtimeVersion = request.headers.get("expo-runtime-version") ?? "";
  const protocolVersion = request.headers.get("expo-protocol-version") ?? "0";

  if (!platform || !runtimeVersion) {
    return new Response("Missing expo-platform or expo-runtime-version header", {
      status: 400,
    });
  }

  // Find the latest update for this runtime version
  const prefix = `updates/${runtimeVersion}/`;
  const list = await env.RELEASES.list({ prefix, delimiter: "/" });

  // Get all update directories, sorted descending (newest first)
  const dirs = list.delimitedPrefixes
    .map((p) => p.replace(prefix, "").replace("/", ""))
    .filter((d) => /^\d+$/.test(d))
    .sort((a, b) => Number(b) - Number(a));

  if (dirs.length === 0) {
    if (protocolVersion === "1") {
      return new Response(null, {
        status: 204,
        headers: { "expo-protocol-version": "1" },
      });
    }
    return jsonResponse({ error: "No updates available" }, 404);
  }

  const latestDir = dirs[0];
  const updatePath = `${prefix}${latestDir}`;

  // Read metadata.json
  const metaObj = await env.RELEASES.get(`${updatePath}/metadata.json`);
  if (!metaObj) {
    return jsonResponse({ error: "metadata.json not found" }, 404);
  }
  const metadata = (await metaObj.json()) as UpdateMetadata;

  // Read expoConfig.json
  const configObj = await env.RELEASES.get(`${updatePath}/expoConfig.json`);
  const expoConfig = configObj ? await configObj.json() : {};

  // Get platform-specific file metadata
  const platformMeta = metadata.fileMetadata[platform as "ios" | "android"];
  if (!platformMeta) {
    return jsonResponse({ error: `No metadata for platform: ${platform}` }, 404);
  }

  const baseUrl = `${url.protocol}//${url.host}`;

  // Build assets array
  const assets = platformMeta.assets.map((asset) => {
    const ext = `.${asset.ext}`;
    const filename = asset.path.split("/").pop() ?? "";
    return {
      hash: filename,
      key: filename,
      fileExtension: ext,
      contentType: EXT_TO_MIME[ext] ?? "application/octet-stream",
      url: `${baseUrl}/api/assets?asset=${encodeURIComponent(`${updatePath}/${asset.path}`)}&runtimeVersion=${runtimeVersion}&platform=${platform}`,
    };
  });

  // Build launch asset (JS bundle)
  const bundleName = platformMeta.bundle.split("/").pop() ?? "";
  const launchAsset = {
    hash: bundleName,
    key: bundleName,
    fileExtension: ".bundle",
    contentType: "application/javascript",
    url: `${baseUrl}/api/assets?asset=${encodeURIComponent(`${updatePath}/${platformMeta.bundle}`)}&runtimeVersion=${runtimeVersion}&platform=${platform}`,
  };

  // Generate a deterministic UUID from the update path + platform
  const updateId = await generateUUID(`${updatePath}-${platform}`);

  const manifest = {
    id: updateId,
    createdAt: new Date(Number(latestDir) * 1000).toISOString(),
    runtimeVersion,
    assets,
    launchAsset,
    metadata: {},
    extra: {
      scopeKey: "@anonymous/bitk",
      expoClient: expoConfig,
    },
  };

  const headers: Record<string, string> = {
    "expo-protocol-version": protocolVersion,
    "expo-sfv-version": "0",
    "cache-control": "private, max-age=0",
  };

  // Protocol v1 requires multipart/mixed response
  if (protocolVersion === "1") {
    const boundary = "ota-boundary";
    const body = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="manifest"`,
      `Content-Type: application/json; charset=utf-8`,
      ``,
      JSON.stringify(manifest),
      `--${boundary}`,
      `Content-Disposition: form-data; name="extensions"`,
      `Content-Type: application/json`,
      ``,
      JSON.stringify({ assetRequestHeaders: {} }),
      `--${boundary}--`,
      ``,
    ].join("\r\n");

    return new Response(body, {
      headers: {
        ...headers,
        "content-type": `multipart/mixed; boundary=${boundary}`,
      },
    });
  }

  // Protocol v0 fallback: plain JSON
  return new Response(JSON.stringify(manifest), {
    headers: {
      ...headers,
      "content-type": "application/json",
    },
  });
}

async function handleOTAAsset(
  _request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const assetPath = url.searchParams.get("asset");
  if (!assetPath) {
    return new Response("Missing asset parameter", { status: 400 });
  }

  const obj = await env.RELEASES.get(assetPath);
  if (!obj) {
    return new Response("Asset not found", { status: 404 });
  }

  // Determine content type from extension
  const ext = assetPath.match(/\.[^.]+$/)?.[0] ?? "";
  const contentType = EXT_TO_MIME[ext] ?? "application/octet-stream";

  return new Response(obj.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(obj.size),
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Landing page
    if (path === "/" || path === "") {
      const [info, releases] = await Promise.all([
        getLatestInfo(env.RELEASES),
        listReleases(env.RELEASES),
      ]);
      return new Response(renderLanding(info, releases), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": `public, max-age=${CACHE_TTL}`,
        },
      });
    }

    // App icon (served from R2)
    if (path === "/icon.png") {
      const obj = await env.RELEASES.get("icon.png");
      if (!obj) return new Response("Not Found", { status: 404 });
      return new Response(obj.body, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // Android APK download
    if (path === "/download/android") {
      const info = await getLatestInfo(env.RELEASES);
      if (!info?.android_url) {
        return new Response("No Android release available", { status: 404 });
      }
      const obj = await env.RELEASES.get(info.android_url);
      if (!obj) return new Response("Artifact not found", { status: 404 });
      return new Response(obj.body, {
        headers: {
          "Content-Type": "application/vnd.android.package-archive",
          "Content-Disposition": `attachment; filename="bkd-v${info.version}.apk"`,
          "Content-Length": String(obj.size),
        },
      });
    }

    // iOS install — redirect to itms-services
    if (path === "/download/ios") {
      const baseUrl = `${url.protocol}//${url.host}`;
      const manifestUrl = `${baseUrl}/download/ios/manifest.plist`;
      return Response.redirect(
        `itms-services://?action=download-manifest&url=${encodeURIComponent(manifestUrl)}`,
        302,
      );
    }

    // iOS manifest.plist
    if (path === "/download/ios/manifest.plist") {
      const info = await getLatestInfo(env.RELEASES);
      if (!info?.ios_url) {
        return new Response("No iOS release available", { status: 404 });
      }
      const baseUrl = `${url.protocol}//${url.host}`;
      const ipaUrl = `${baseUrl}/download/ios/artifact`;
      const plist = renderManifest(ipaUrl, BUNDLE_ID, info.version, APP_TITLE);
      return new Response(plist, {
        headers: { "Content-Type": "application/xml" },
      });
    }

    // iOS IPA artifact stream
    if (path === "/download/ios/artifact") {
      const info = await getLatestInfo(env.RELEASES);
      if (!info?.ios_url) {
        return new Response("No iOS release available", { status: 404 });
      }
      const obj = await env.RELEASES.get(info.ios_url);
      if (!obj) return new Response("Artifact not found", { status: 404 });
      return new Response(obj.body, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Length": String(obj.size),
        },
      });
    }

    // Direct Android download by version: /download/android/v1.0.0
    const androidVersionMatch = path.match(/^\/download\/android\/v(.+)$/);
    if (androidVersionMatch) {
      const version = androidVersionMatch[1];
      const key = `android/bkd-v${version}.apk`;
      const obj = await env.RELEASES.get(key);
      if (!obj) return new Response("Artifact not found", { status: 404 });
      return new Response(obj.body, {
        headers: {
          "Content-Type": "application/vnd.android.package-archive",
          "Content-Disposition": `attachment; filename="bkd-v${version}.apk"`,
          "Content-Length": String(obj.size),
        },
      });
    }

    // iOS install by version: /download/ios/v1.0.0 → itms-services redirect
    const iosVersionMatch = path.match(/^\/download\/ios\/v(.+)$/);
    if (iosVersionMatch) {
      const version = iosVersionMatch[1];
      const baseUrl = `${url.protocol}//${url.host}`;
      const manifestUrl = `${baseUrl}/download/ios/v${version}/manifest.plist`;
      return Response.redirect(
        `itms-services://?action=download-manifest&url=${encodeURIComponent(manifestUrl)}`,
        302,
      );
    }

    // iOS manifest.plist by version: /download/ios/v1.0.0/manifest.plist
    const iosManifestMatch = path.match(/^\/download\/ios\/v(.+)\/manifest\.plist$/);
    if (iosManifestMatch) {
      const version = iosManifestMatch[1];
      const key = `ios/bkd-v${version}.ipa`;
      const obj = await env.RELEASES.head(key);
      if (!obj) return new Response("No iOS release available", { status: 404 });
      const baseUrl = `${url.protocol}//${url.host}`;
      const ipaUrl = `${baseUrl}/download/ios/v${version}/artifact`;
      const plist = renderManifest(ipaUrl, BUNDLE_ID, version, APP_TITLE);
      return new Response(plist, {
        headers: { "Content-Type": "application/xml" },
      });
    }

    // iOS IPA artifact by version: /download/ios/v1.0.0/artifact
    const iosArtifactMatch = path.match(/^\/download\/ios\/v(.+)\/artifact$/);
    if (iosArtifactMatch) {
      const version = iosArtifactMatch[1];
      const key = `ios/bkd-v${version}.ipa`;
      const obj = await env.RELEASES.get(key);
      if (!obj) return new Response("Artifact not found", { status: 404 });
      return new Response(obj.body, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Length": String(obj.size),
        },
      });
    }

    // API — version info
    if (path === "/api/version") {
      const info = await getLatestInfo(env.RELEASES);
      return jsonResponse(info ?? { error: "no release" }, info ? 200 : 404);
    }

    // ===== OTA Updates (expo-updates protocol) =====

    // GET /api/manifest — expo-updates manifest endpoint
    if (path === "/api/manifest") {
      return handleOTAManifest(request, env, url);
    }

    // GET /api/assets — serve update assets from R2
    if (path.startsWith("/api/assets")) {
      return handleOTAAsset(request, env, url);
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
