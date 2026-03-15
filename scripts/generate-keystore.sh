#!/usr/bin/env bash
# Generate an Android release keystore for signing APKs.
# Usage: ./scripts/generate-keystore.sh
#
# After generation:
#   1. base64 encode: base64 -i bkd-release.keystore | pbcopy
#   2. Add to GitHub Secrets:
#      - ANDROID_KEYSTORE_BASE64 = (paste)
#      - ANDROID_KEYSTORE_PASSWORD = <password you entered>
#      - ANDROID_KEY_ALIAS = bkd
#      - ANDROID_KEY_PASSWORD = <key password you entered>

set -euo pipefail

KEYSTORE_FILE="bkd-release.keystore"
KEY_ALIAS="bkd"

if [ -f "$KEYSTORE_FILE" ]; then
  echo "ERROR: $KEYSTORE_FILE already exists. Remove it first if you want to regenerate."
  exit 1
fi

echo "Generating Android release keystore..."
keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keystore "$KEYSTORE_FILE" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=BKD, OU=Mobile, O=BK, L=Unknown, S=Unknown, C=US"

echo ""
echo "Keystore generated: $KEYSTORE_FILE"
echo ""
echo "Next steps:"
echo "  1. base64 encode:  base64 -i $KEYSTORE_FILE"
echo "  2. Add these GitHub Secrets:"
echo "     ANDROID_KEYSTORE_BASE64   = <base64 output>"
echo "     ANDROID_KEYSTORE_PASSWORD = <store password>"
echo "     ANDROID_KEY_ALIAS         = $KEY_ALIAS"
echo "     ANDROID_KEY_PASSWORD      = <key password>"
echo ""
echo "IMPORTANT: Keep this keystore file safe. If lost, you cannot update your app."
