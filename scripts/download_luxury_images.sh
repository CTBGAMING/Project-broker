#!/usr/bin/env bash
# Download luxury-themed hero and section images into src/assets/
mkdir -p src/assets
echo "Downloading curated luxury images (Unsplash) into src/assets/ ..."
# Replace or add URLs below if you prefer different images.
urls=(
"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&q=80&auto=format&fit=crop" # luxury interior
"https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1600&q=80&auto=format&fit=crop" # premium event
"https://images.unsplash.com/photo-1505691723518-36a6f63e9d6b?w=1600&q=80&auto=format&fit=crop" # gold lighting
"https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=1600&q=80&auto=format&fit=crop" # black gold aesthetic
)
i=0
for url in "${urls[@]}"; do
  out="src/assets/hero_luxury_$((i+1)).jpg"
  echo "Downloading $url -> $out"
  # Try curl or wget
  if command -v curl >/dev/null 2>&1; then
    curl -L -o "$out" "$url"
  elif command -v wget >/dev/null 2>&1; then
    wget -O "$out" "$url"
  else
    python - <<PY
import urllib.request, sys
url = "$url"
out = "$out"
print('Downloading via python urllib', url, '->', out)
urllib.request.urlretrieve(url, out)
PY
  fi
  i=$((i+1))
done
echo "Done. Replace placeholders with these downloaded files or your own images."
