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

output = {
        "offset": list([(x).item() for x in (img_emb - text_emb)]),
        "blank": list([(x).item() for x in blank_emb])
}

print(json.dumps(output))
