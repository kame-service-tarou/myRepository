import os
import subprocess
import sys

# Run a User Mode Linux (UML) interactively, capturing output.
with subprocess.Popen(
    ["./vmlinux", "initrd=./root_fs.cpio.gz", "rdinit=/chal"],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    bufsize=0,  # make unbuffered
) as p:
    output = bytearray()
    while True:
        data = p.stdout.read(4096)
        if not data:
            break
        sys.stdout.buffer.write(data)
        sys.stdout.buffer.flush()
        output.extend(data)
    p.wait()

    print(f"[server.py] {p.returncode = }")
    if p.returncode == 0 and b"Power down" in output:
        flag = os.getenv("FLAG", "Alpaca{REDACTED}")
        print(f"[server.py] Linux has been shut down properly! FLAG: {flag}")
    else:
        print("[server.py] It seems that Linux has not been shut down properly...")
