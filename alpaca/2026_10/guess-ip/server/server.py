import os
import psutil
import socket

FLAG = os.environ.get("FLAG", "Alpaca{REDACTED}")

message = (
    f"Hello from {psutil.net_if_addrs()['eth0'][0].address}\n"
    f"Here is your flag: {FLAG}"
)

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind(("0.0.0.0", 1234))

while True:
    data, addr = sock.recvfrom(4096)
    sock.sendto(message.encode(), addr)
