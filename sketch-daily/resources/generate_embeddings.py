#!/bin/env python3
from sentence_transformers import SentenceTransformer
import json
import sys

model = SentenceTransformer('clip-ViT-B-32')

d = json.load(open(sys.argv[1]))
prompt = "a simple doodle of "
words = [x for x in d.values()]
keys = [x for x in d.keys()]
text_emb = model.encode([prompt + x for x in words])

output = { keys[i]: {
        "word": words[i],
        "embedding": list([(x).item() for x in text_emb[i]])
} for i in range(0, len(words)) }

print(json.dumps(output))
