#include <stddef.h>
#include <stdint.h>
#include <sys/syscall.h>
#include <unistd.h>

/* Run a system call using 4 arguments. */
/* __attribute__((unused)) are used to disable warnings when build */
uint64_t __attribute__((naked))
my_syscall_4(__attribute__((unused)) uint64_t syscall_number,
             __attribute__((unused)) uint64_t arg1,
             __attribute__((unused)) uint64_t arg2,
             __attribute__((unused)) uint64_t arg3,
             __attribute__((unused)) uint64_t arg4) {
  asm("mov %rdi, %rax\n"
      "mov %rsi, %rdi\n"
      "mov %rdx, %rsi\n"
      "mov %rcx, %rdx\n"
      "mov %r8,  %r10\n"
      "syscall\n"
      "ret\n");
}

/* Run a system call using 3 arguments. */
uint64_t my_syscall_3(uint64_t syscall_number, uint64_t arg1, uint64_t arg2, uint64_t arg3) {
  return my_syscall_4(syscall_number, arg1, arg2, arg3, 0);
}

/* Run a system call using 1 argument. */
uint64_t my_syscall_1(uint64_t syscall_number, uint64_t arg1) {
  return my_syscall_4(syscall_number, arg1, 0, 0, 0);
}

/* Write a string to stdout. */
ssize_t my_write(const char *s) {
  size_t size = 0;
  while (s[size]) {
    ++size;
  }

  return my_syscall_3(SYS_write, STDOUT_FILENO, (uint64_t)s, size);
}

/* Write a string and exit. */
void __attribute__((noreturn)) my_fatal(const char *message) {
  my_write(message);
  my_syscall_1(SYS_exit, 1);
  __builtin_unreachable();
}

/* Read a string from stdin, then parse it as decimal number. */
uint32_t my_read_uint32() {
  char buf[64] = {};
  ssize_t size = (ssize_t)my_syscall_3(SYS_read, STDIN_FILENO, (uint64_t)buf, sizeof(buf) - 1);
  if (size <= 0) {
    my_fatal("Failed to read...\n");
  }

  uint32_t result = 0;
  for (int i = 0; buf[i] && buf[i] != '\n'; ++i) {
    char c = buf[i];
    if ('0' <= c && c <= '9') {
      result *= 10;
      result += (c - '0');
    } else {
      my_fatal("Characters should be digits...\n");
    }
  }
  return result;
}

/* An entry point function. */
int _start() {
  my_write(" _         _   _       ____  _           _     ____                        _     _                  \n");
  my_write("| |    ___| |_( )___  / ___|| |__  _   _| |_  |  _ \\  _____      ___ __   | |   (_)_ __  _   ___  __\n");
  my_write("| |   / _ \\ __|// __| \\___ \\| '_ \\| | | | __| | | | |/ _ \\ \\ /\\ / / '_ \\  | |   | | '_ \\| | | \\ \\/ /\n");
  my_write("| |__|  __/ |_  \\__ \\  ___) | | | | |_| | |_  | |_| | (_) \\ V  V /| | | | | |___| | | | | |_| |>  < \n");
  my_write("|_____\\___|\\__| |___/ |____/|_| |_|\\__,_|\\__| |____/ \\___/ \\_/\\_/ |_| |_| |_____|_|_| |_|\\__,_/_/\\_\\\n");

  my_write("Specify arg1, arg2, and arg3 in decimal to be used in the reboot system call to shut down Linux.\n");
  my_write("arg1: ");
  uint32_t arg1 = my_read_uint32();
  my_write("arg2: ");
  uint32_t arg2 = my_read_uint32();
  my_write("arg3: ");
  uint32_t arg3 = my_read_uint32();
  my_write("Running a reboot system call!\n");
  my_syscall_4(SYS_reboot, arg1, arg2, arg3, (uint64_t)"A constant string");
  my_fatal("Failed to shut down. Kernel panic will occur...\n");
}
