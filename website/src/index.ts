import { renderLanding, type VersionInfo } from "./templates/landing";
import { renderManifest } from "./templates/manifest";

interface Env {
  RELEASES: R2Bucket;
}

const BUNDLE_ID = "io.bk.bkd";
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
      const info = await getLatestInfo(env.RELEASES);
      return new Response(renderLanding(info), {
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

    // API — version info
    if (path === "/api/version") {
      const info = await getLatestInfo(env.RELEASES);
      return jsonResponse(info ?? { error: "no release" }, info ? 200 : 404);
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
