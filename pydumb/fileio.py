#!/usr/bin/env python3
import fileinput
_DELIM = ' '

def read():
    script = [line.replace('\t', _DELIM*4).split(_DELIM) for line in fileinput.input()]
    return script
        

def write(script):
    return ''.join([_DELIM.join(line) for line in script])
