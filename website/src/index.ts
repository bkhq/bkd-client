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

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
