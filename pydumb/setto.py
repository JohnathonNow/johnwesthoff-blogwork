#!/usr/bin/env python3
import token
def rule(parser):
    _vars = []
    _len = 0
    def match():
        nonlocal parser, _vars, _len
        _vars = []
        _len = 0
        if parser.peek()[:3] == 'set':
            while 1:
                _len += 1
                if parser.peek(_len)[:2] == 'to':
                    return True
                elif parser.peek(_len)[:3] == 'and':
                    if parser.peek(_len+1)[:2] == 'to' or parser.peek(_len+1)[:3] == 'and':
                        return False
                else:
                    _vars += [parser.peek(_len).replace(',', '')]
        else:
            return False

    def action():
        parser.replace([' = '.join(_vars) + ' ='], _len + 1)

    return token.Token(match, action)
