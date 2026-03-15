export interface VersionInfo {
  version: string;
  date: string;
  android_url: string;
  ios_url: string;
}

export function renderLanding(info: VersionInfo | null): string {
  const version = info?.version ?? "—";
  const date = info?.date ?? "";
  const hasAndroid = Boolean(info?.android_url);
  const hasIos = Boolean(info?.ios_url);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BKD — Download</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f0f1a;
      color: #e0e0e0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .container {
      max-width: 480px;
      width: 100%;
      text-align: center;
    }

    .logo {
      width: 96px;
      height: 96px;
      border-radius: 22px;
      margin-bottom: 1.5rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #8888aa;
      font-size: 0.95rem;
      margin-bottom: 2rem;
    }

    .version {
      display: inline-block;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      color: #aaaacc;
      margin-bottom: 2rem;
    }

    .buttons {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      padding: 0.9rem 1.5rem;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.15s, box-shadow 0.15s;
    }

    .btn:active { transform: scale(0.97); }

    .btn-android {
      background: linear-gradient(135deg, #34a853, #2d8f47);
      color: #fff;
    }

    .btn-ios {
      background: linear-gradient(135deg, #3478f6, #2960d0);
      color: #fff;
    }

    .btn-disabled {
      background: rgba(255, 255, 255, 0.06);
      color: #666;
      pointer-events: none;
    }

    .btn svg { width: 22px; height: 22px; fill: currentColor; }

    .footer {
      margin-top: 3rem;
      font-size: 0.8rem;
      color: #555;
    }

    .footer a { color: #6666aa; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <img class="logo" src="/icon.png" alt="BKD" />
    <h1>BKD</h1>
    <p class="subtitle">BKD Platform Client</p>

    <div class="version">
      ${version !== "—" ? `v${version} &middot; ${date}` : "No release yet"}
    </div>

    <div class="buttons">
      <a class="btn ${hasAndroid ? "btn-android" : "btn-disabled"}"
         href="${hasAndroid ? "/download/android" : "#"}">
        <svg viewBox="0 0 24 24"><path d="M17.523 2.226l1.392-2.092a.474.474 0 00-.795-.515l-1.453 2.186A8.532 8.532 0 0012 .998c-1.676 0-3.243.482-4.667 1.307L5.88.119a.474.474 0 00-.795.515L6.477 2.726C3.893 4.256 2.202 6.858 2 10h20c-.202-3.142-1.893-5.744-4.477-7.274zM7 7.5a1 1 0 110-2 1 1 0 010 2zm10 0a1 1 0 110-2 1 1 0 010 2zM3 11h18v1H3zm0 2h18v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
        Android APK
      </a>

      <a class="btn ${hasIos ? "btn-ios" : "btn-disabled"}"
         href="${hasIos ? "/download/ios" : "#"}">
        <svg viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
        iOS (Ad Hoc)
      </a>
    </div>

    <p class="footer">
      <a href="https://github.com/bkhq/bitk-client">GitHub</a>
    </p>
  </div>
</body>
</html>`;
}
