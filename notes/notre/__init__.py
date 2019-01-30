#!/usr/bin/env python3
import fileinput


def parse(escapes, accents, underlines):
    skip = False
    output = ['<pre>']
    for line in fileinput.input():
        line_out = []
        i = 0
        while i < len(line):
            c = line[i]
            i += 1
            if c == '\\':
                glob = []
                c = line[i]
                while not c.isspace() and not c in ['\\', '`']:
                    glob.append(c)
                    i += 1
                    c = line[i]
                glob = ''.join(glob)
                if glob in escapes:
                    line_out.append(escapes[glob])
                else:
                    line_out.append(glob)
            elif c == '`':
                skip = not skip
            elif c in accents and not skip:
                line_out.append('<{1}{0}>'.format(*accents[c]))
                accents[c][1] = {'':'/', '/':''}[accents[c][1]]
            else:
                line_out.append(c)

        line_out_str = ''.join(line_out)
        stripped = line_out_str.strip()
        if any([all(c == d for c in stripped) for d in underlines]) and not len(stripped) == 0:
                output[-1] = '<{1}>{0}</{1}>'.format(output[-1], underlines[stripped[0]])
        else:
            output.append(line_out_str)

    return output

