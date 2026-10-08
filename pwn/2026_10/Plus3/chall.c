// gcc -fno-stack-protector -no-pie -o chall chall.c 

#include <stdio.h>
#include <stdlib.h>

int num = 0;

int win() {
    char *cmd = "/bin/sh";
    if (num == 3) {
        system(cmd);
    }
    return 0;
}

int plus() {
    num++;
    return 0;
}

int vuln() {
    char name[0x10];
    printf("name: ");
    scanf("%s", name);
    printf("Hello, %s!\n", name);
    return 0;
}

int main() {
    vuln();
    return 0;
}

__attribute__((constructor))
void setup() {
    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);
}