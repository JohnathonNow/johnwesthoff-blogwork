#!/usr/bin/env python
from PIL import Image
HEIGHT = 1200

STATE_HEIGHT = 206
STATE_WIDTH = 500
STATE_ENTRY = 9
STATE_EXIT_START = 33
STATE_EXIT_OFFSET = 43

START_HEIGHT = 56
START_WIDTH = 100
START_EXIT = 23

states = 1

start = Image.open("./loadtape.png")
state = Image.open("./blankstate.png")

img = Image.new( 'RGB', (STATE_WIDTH*states+START_WIDTH,HEIGHT), "white")
pixels = img.load()

img.paste(start, (0,HEIGHT-START_HEIGHT))
img.paste(state, (START_WIDTH,HEIGHT - STATE_HEIGHT - (START_EXIT - STATE_ENTRY)))

img.convert("1")
img.save("result.png")
