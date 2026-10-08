FROM ubuntu:26.04@sha256:f3d28607ddd78734bb7f71f117f3c6706c666b8b76cbff7c9ff6e5718d46ff64

RUN apt-get update && \
    apt-get install -y socat \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m ctf

WORKDIR /home/ctf

COPY --chmod=550 chall /home/ctf/chall
COPY --chmod=444 flag.txt /home/ctf/flag.txt

RUN chown -R root:ctf /home/ctf && \
    chmod 750 /home/ctf

USER ctf

EXPOSE 1337

CMD ["socat", "TCP-LISTEN:1337,fork,reuseaddr", "EXEC:timeout 30 /home/ctf/chall,stderr"]
