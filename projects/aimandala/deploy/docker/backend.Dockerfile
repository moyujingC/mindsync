FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend \
    PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple \
    PIP_DEFAULT_TIMEOUT=100

WORKDIR /app

COPY toC/app/backend/requirements.release.txt /tmp/requirements.release.txt

RUN pip install --no-cache-dir -r /tmp/requirements.release.txt

COPY toC/app/backend /app/backend

EXPOSE 8000

CMD ["uvicorn", "app.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
