#!/usr/bin/env python3
class Token:
    def __init__(self, match, action):
        self.match = match
        self.action = action

    def apply(self):
        if (self.match()):
            self.action()
