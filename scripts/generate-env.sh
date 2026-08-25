#!/bin/sh
# Generate a runtime configuration file for the frontend.
# Only NEXT_PUBLIC_API_SERVER_URL is needed — the single source of truth.
cat <<EOF > /app/public/env-config.js
window.__ENV__ = {
  NEXT_PUBLIC_API_SERVER_URL: "${NEXT_PUBLIC_API_SERVER_URL}"
};
EOF
