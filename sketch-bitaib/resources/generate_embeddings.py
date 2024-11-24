#!/bin/env python3
from sentence_transformers import SentenceTransformer
import json
import fileinput

model = SentenceTransformer('clip-ViT-B-32')

d = list(fileinput.input())
prompt = "an electronic doodle depicting "
text_emb = model.encode([prompt + x for x in d])

output = [{
        "word": d[i].strip(),
        "embedding": list([(x).item() for x in text_emb[i]])
} for i in range(0, len(d))]

print(json.dumps(output))
