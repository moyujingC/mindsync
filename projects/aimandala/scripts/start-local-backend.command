#!/bin/zsh

cd /Users/xinran/Downloads/dev/mindsync || exit 1
export PYTHONPATH=/Users/xinran/Downloads/dev/mindsync/projects/aimandala/toC/app/backend
python3 -m uvicorn app.api.main:app --host 127.0.0.1 --port 8100
