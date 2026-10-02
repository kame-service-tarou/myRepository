FROM python:3.14.5-slim-trixie

WORKDIR /app

RUN pip install --no-cache-dir psutil==7.2.2

COPY server.py .

USER nobody:nogroup
CMD ["python", "server.py"]
