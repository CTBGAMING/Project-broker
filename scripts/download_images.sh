#!/usr/bin/env bash
mkdir -p src/assets
cat supabase/images_to_download.json | python - <<'PY'
import json,sys,os,urllib.request
data=json.load(open('supabase/images_to_download.json'))
for it in data:
    name=it['name']
    url=it['url']
    out='src/assets/'+name
    print('Downloading',url,'->',out)
    urllib.request.urlretrieve(url,out)
print('Done')
PY
