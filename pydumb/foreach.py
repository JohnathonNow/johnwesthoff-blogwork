#!/usr/bin/env python3
import token
def rule(parser):
    def match():
        nonlocal parser
        return parser.peek()[:3] == 'for' and parser.peek(1)[:4] == 'each'

    def action():
        parser.replace(['for', parser.peek(2)[:-2], 'in', parser.peek(2)[:-2]+'s:\n'])

    return token.Token(match, action)
