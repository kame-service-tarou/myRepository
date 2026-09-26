TARGET = chal
CXX = gcc
# Don't depend on glibc.
CXXFLAGS = -Wall -Wextra -static -nostdlib

all: $(TARGET)

$(TARGET): chal.c
	$(CXX) $(CXXFLAGS) chal.c -o $(TARGET)

clean:
	rm -f $(TARGET)
