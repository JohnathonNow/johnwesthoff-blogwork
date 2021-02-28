#!/usr/bin/env python3
import fileio
import foreach
import setto
from parser import Parser

def run(op=print):
    script = fileio.read()
    parser = Parser(script)
    rules = [foreach.rule(parser), setto.rule(parser)]
    while not parser.done():
        for r in rules:
            r.apply() 
        parser.next()
    op(fileio.write(parser.script))
    

run(exec)
