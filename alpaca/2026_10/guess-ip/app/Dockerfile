FROM python:3.14.5-slim-trixie
WORKDIR /app
RUN apt-get update && apt-get install -yq socat

COPY app.py .

USER nobody:nogroup
CMD ["socat", "-T30", "tcp-listen:1337,fork,reuseaddr", "exec:'python app.py',stderr"]
