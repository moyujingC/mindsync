#!/bin/zsh

cd /Users/xinran/Downloads/dev/mindsync/projects/aimandala/toC/app/frontend || exit 1
export AIMANDALA_VITE_PROXY_TARGET=http://127.0.0.1:8100
export VITE_AIMANDALA_API_BASE_URL=http://127.0.0.1:8100
npm run dev:mobile-web -- --host 127.0.0.1 --port 4174
