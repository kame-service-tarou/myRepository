ARG KERNEL_VERSION=6.18.45

# NOTE: This hash is pinned to avoid version and environment differences.
FROM python:3.14-slim-trixie@sha256:ce40764625a4ff50df3548277632e7f96c4e77fe75fa848aae9885476e7df5a4 AS builder

RUN apt-get update && apt-get install -y \
    bc \
    build-essential \
    bison \
    flex \
    wget \
    && rm -rf /var/lib/apt/lists/*

ARG KERNEL_VERSION
WORKDIR /build
RUN wget "https://cdn.kernel.org/pub/linux/kernel/v6.x/linux-${KERNEL_VERSION}.tar.xz" \
    && tar -xf "linux-${KERNEL_VERSION}.tar.xz" \
    && rm "linux-${KERNEL_VERSION}.tar.xz"

# Build a User Mode Linux (UML)
# - https://www.kernel.org/doc/html/v5.7/virt/uml/user_mode_linux.html#compiling-the-kernel
# - https://www.kernel.org/doc/html/latest/virt/uml/user_mode_linux_howto_v2.html
WORKDIR /build/linux-${KERNEL_VERSION}
RUN cat > miniconfig <<'EOF'
CONFIG_UML=y
CONFIG_64BIT=y
# Support an initrd feature and install related scripts.
CONFIG_BLK_DEV_INITRD=y
# Support a .cpio.gz format.
CONFIG_RD_GZIP=y
# Supress warnigs such as `setup_one_line failed for device 1 : failed to parse channel pair` on boot.
CONFIG_NULL_CHAN=y
CONFIG_CON_CHAN="null"
# Support an elf format.
CONFIG_BINFMT_ELF=y
EOF
RUN make ARCH=um KCONFIG_ALLCONFIG=miniconfig allnoconfig \
    && make ARCH=um -j"$(nproc)"

# Prepare a root filesystem
RUN mkdir -p root_fs
COPY --chmod=755 chal root_fs
RUN mkdir -p root_fs/dev \
    # (5,1) is /dev/console starting with Linux 2.1.71. https://github.com/torvalds/linux/blob/v6.18/Documentation/admin-guide/devices.txt#L162
    && mknod root_fs/dev/console c 5 1 \
    && chmod 600 root_fs/dev/console
RUN usr/gen_initramfs.sh -o /build/root_fs.cpio.gz root_fs

FROM python:3.14-slim-trixie@sha256:ce40764625a4ff50df3548277632e7f96c4e77fe75fa848aae9885476e7df5a4

RUN apt-get update && apt-get install -y \
    socat \
    && rm -rf /var/lib/apt/lists/*

ARG KERNEL_VERSION
WORKDIR /app
COPY --from=builder /build/linux-${KERNEL_VERSION}/vmlinux /build/root_fs.cpio.gz ./
COPY --chmod=644 server.py .
CMD ["socat", "-T30", "tcp-listen:1337,fork,reuseaddr", "exec:'python3 server.py',stderr"]
