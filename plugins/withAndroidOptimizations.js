/**
 * Expo config plugin: enable ProGuard/R8 shrinking for release builds
 * and configure Android 15 (API 35) compatibility.
 */
const { withAppBuildGradle, withAndroidManifest } = require('expo/config-plugins')

function withProguard(config) {
  return withAppBuildGradle(config, (cfg) => {
    const contents = cfg.modResults.contents

    // Enable minification for release builds
    // Replace `isMinifyEnabled = false` with `isMinifyEnabled = true` in release block
    cfg.modResults.contents = contents.replace(
      /buildTypes\s*\{[\s\S]*?release\s*\{([\s\S]*?)\}/,
      (match) => {
        // Enable minifyEnabled and shrinkResources
        let updated = match
        if (updated.includes('isMinifyEnabled')) {
          updated = updated.replace(/isMinifyEnabled\s*=\s*false/, 'isMinifyEnabled = true')
        }
        // Add shrinkResources if not present
        if (!updated.includes('isShrinkResources') && !updated.includes('shrinkResources')) {
          updated = updated.replace(
            /isMinifyEnabled\s*=\s*true/,
            'isMinifyEnabled = true\n            isShrinkResources = true',
          )
        }
        return updated
      },
    )

    return cfg
  })
}

function withAndroid15Compat(config) {
  return withAndroidManifest(config, (cfg) => {
    const mainApp = cfg.modResults.manifest.application?.[0]
    if (mainApp) {
      // Ensure we don't crash on edge-to-edge enforcement in Android 15
      // by keeping the default behavior compatible
      const mainActivity = mainApp.activity?.find(
        (a) => a.$?.['android:name'] === '.MainActivity',
      )
      if (mainActivity) {
        // Set windowSoftInputMode for proper keyboard handling
        mainActivity.$['android:windowSoftInputMode'] = 'adjustResize'
      }
    }
    return cfg
  })
}

module.exports = function withAndroidOptimizations(config) {
  config = withProguard(config)
  config = withAndroid15Compat(config)
  return config
}
