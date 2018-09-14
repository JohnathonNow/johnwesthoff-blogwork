import board
import pulseio
import time
import mapping
from digitalio import DigitalInOut, Direction
from adafruit_hid.keyboard import Keyboard

clk = DigitalInOut(board.D4)
#Send some pulses, needed so the Model M starts sending scancodes
clk.direction = Direction.OUTPUT
clk.value = False
time.sleep(0.006)
clk.value = True
time.sleep(0.006)
clk.value = False
time.sleep(0.006)
clk.direction = Direction.INPUT


kbd = Keyboard()
pulses = pulseio.PulseIn(board.D3, maxlen=12, idle_state=True)

pulses.resume()
while True:
    if not clk.value:
        time.sleep(0.005)
        pulses.pause()
        a = tuple([int(pulses[pulse]/80) for pulse in range(1,len(pulses))])
        if not a:
            pass
        elif a in mapping.modifiers:
            #if we pressed a modifer, well press it
            kbd.press(mapping.modifiers[a])
        elif a[0] in (17, 24) and a[2:] in mapping.modifiers:
            #the first part of the tuple is always 17 or 24 for releases
            #so if we released a modifer, release it
            kbd.release(mapping.modifiers[a[2:]])
        elif a in mapping.keys:
            kbd.press(mapping.keys[a])
            kbd.release(mapping.keys[a])
        else:
            print(a)
        pulses.clear()
        pulses.resume()
