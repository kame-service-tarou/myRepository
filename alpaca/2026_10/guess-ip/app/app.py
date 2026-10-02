import ipaddress
import socket

print("Example: 10.123.45.67")
ip = input("Enter IP> ").strip()

try:
    ipaddress.IPv4Address(ip)
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(1.0)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

    sock.sendto(b"hello", (ip, 1234))

    try:
        data, _ = sock.recvfrom(4096)
        print(data.decode())
    except socket.timeout:
        print("no response")

except Exception as e:
    print(f"Error: {e}")
