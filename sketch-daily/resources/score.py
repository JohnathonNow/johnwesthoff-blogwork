#!/bin/env python3
from sentence_transformers import SentenceTransformer
import json
import sys
from PIL import Image

model = SentenceTransformer('clip-ViT-B-32')

prompt = "a simple doodle of " + sys.argv[1]
img_emb = model.encode(Image.open(sys.argv[2]))
blank_emb = model.encode(Image.open("blank.png"))
text_emb = model.encode(prompt)
info = json.load(open("offsets.json"))
output = {
        "score": sum(list([(x).item()**2 for x in (img_emb - info["offset"] - text_emb)]))
}

print(json.dumps(output))
