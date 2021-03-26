#!/usr/bin/env python3
import fileinput

resps = {}
competitors = {i: 1000 for i in range(0, 29)}
K = 40

def add(n):
    if n in resps:
        resps[n] += 1
    else:
        resps[n] = 1

for l in fileinput.input():
    name, a, b, r = l.split(',')
    add(name)
    a = int(a.strip())
    b = int(b.strip())
    r = int(r.strip())
    ra = competitors[a]
    rb = competitors[b]
    qa = 10**(ra/400)
    qb = 10**(rb/400)
    ea = qa / (qa + qb)
    eb = qb / (qa + qb)
    sa = 0
    sb = 0
    if r == 1: # A won
        sa = 1
    elif r == 2: # B won
        sb = 1
    elif r == 3: # tie
        sa = .5
        sb = .5
    competitors[a] = ra + K*(sa - ea)
    competitors[b] = rb + K*(sb - eb)

print(competitors)
print(resps)

print(min(competitors, key=competitors.get))
print(max(competitors, key=competitors.get))


for c in competitors:
    print(competitors[c])

