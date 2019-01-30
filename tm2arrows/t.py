s = sorted([ord(i) for i in ["_", "^", "$", "0", "1", "r", "a", "v", "o", "s", "d"]])
for i in s:
    print chr(i), i

def equal(x):
    s = []
    #Check for 36
    s.append(x)
    s.append(x)
    x -= s.pop()
    x += 36
    x -= s.pop()
    if x == 0: return 36
    #Check for 48
    x += 12
    if x == 0: return 48
    #Check for 49
    x += 1
    if x == 0: return 49
    #Check for 94
    x += 45
    if x == 0: return 94
    #Check for 95
    x += 1
    if x == 0: return 95
    #Check for 97
    x += 2
    if x == 0: return 97
    #Check for 100
    x += 3
    if x == 0: return 100
    #Check for 111
    x += 11
    if x == 0: return 111
    #Check for 114
    x += 3
    if x == 0: return 114
    #Check for 115
    x += 1
    if x == 0: return 115
    #Check for 118
    x += 3
    if x == 0: return 118
    #Give up
    return None

for i in range(120):
    print i, equal(i)

"""
[_ _ _ _  |x  _ _ _ _]
to go right, just push to the left stack
[_ _ _ _ x |y _ _ _ _]

[_ _ _ _  |x  _ _ _ _]
to go left, push value to right stack, pop left, and push right
[_ _ _ _ |y x _ _ _ _]
"""
