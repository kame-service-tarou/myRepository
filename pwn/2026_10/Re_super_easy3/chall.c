// gcc -fno-stack-protector -no-pie -o chall chall.c

#include <stdio.h>
#include <stdlib.h>

__attribute__((force_align_arg_pointer))
void win() {
    system("/bin/sh"); // You can launch the shell.
    exit(0);
}

void hello() {
    char name[0x50];
    printf("name : ");
    scanf("%s", name);
    printf("Hello %s!!\n", name);
}

int main() {

    hello();

    return 0;
}

__attribute__((constructor))
void setup() {
    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);
}