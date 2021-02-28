#!/usr/bin/env python3
class Parser:
    def __init__(self, script):
        self.line = script[0]
        self.script = script
        self.cur = 0
        self.curl = 0

    def peek(self, n=0):
        if self.doneLine(n):
            return None
        return self.line[self.cur + n]

    def replace(self, replacement, l=None, i=0):
        if l == None:
            l = len(replacement)
        self.script[self.curl] = self.line[:self.cur+i] + replacement + self.line[self.cur+i+l:]

    def doneLine(self, n=0):
        return self.cur + n >= len(self.line)

    def done(self):
        return self.curl >= len(self.script)

    def next(self):
        self.cur += 1
        if self.done():
            self.cur = len(self.line)
            return None
        if self.doneLine():
            self.cur = 0
            self.curl += 1
            if not self.done():
                self.line = self.script[self.curl]
        return self.line[self.cur - 1]
