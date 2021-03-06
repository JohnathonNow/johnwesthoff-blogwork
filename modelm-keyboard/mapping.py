from adafruit_hid.keycode import Keycode

keys = {
(2, 1, 1, 4):	    Keycode.ONE,
(4, 3):	            Keycode.TWO,
(2, 2, 1, 3):	    Keycode.THREE,
(1, 1, 1, 2, 1, 3):	Keycode.FOUR,
(3, 1, 1, 2):	    Keycode.FIVE,
(2, 1, 2, 2):	    Keycode.SIX,
(1, 1, 4, 3):	    Keycode.SEVEN,
(5, 3):	            Keycode.EIGHT,
(2, 3, 1, 1):	    Keycode.NINE,
(1, 1, 1, 3, 1, 1):	Keycode.ZERO,
(1, 1, 1, 1, 1, 4):	Keycode.Q,
(1, 1, 3, 3):	    Keycode.W,
(1, 2, 1, 2):	    Keycode.E,
(1, 1, 2, 1, 1, 2):	Keycode.R,
(2, 1, 1, 3):	    Keycode.T,
(1, 1, 1, 1, 2, 2):	Keycode.Y,
(4, 2):	            Keycode.U,
(2, 4, 1, 1):	    Keycode.I,
(1, 3, 1, 1):	    Keycode.O,
(1, 1, 2, 2, 1, 1):	Keycode.P,
(3, 4):	            Keycode.A,
(2, 1, 2, 3):	    Keycode.S,
(2, 3, 1, 3):	    Keycode.D,
(2, 1, 1, 1, 1, 2):	Keycode.F,
(1, 1, 2, 3):	    Keycode.G,
(2, 2, 2, 2):	    Keycode.H,
(2, 1, 3, 3):	    Keycode.J,
(1, 4, 1, 1):	    Keycode.K,
(2, 1, 1, 2, 1, 1):	Keycode.L,
(1, 1, 2, 4):	    Keycode.Z,
(1, 3, 1, 2):	    Keycode.X,
(1, 4, 1, 2):	    Keycode.C,
(1, 1, 1, 1, 1, 3):	Keycode.V,
(1, 2, 2, 3):	    Keycode.B,
(1, 3, 2, 3):	    Keycode.N,
(1, 1, 3, 2):	    Keycode.M,
(1, 2, 1, 1, 1, 3): Keycode.SPACE,
(2, 2, 2, 1):       Keycode.BACKSPACE,
(1, 1, 2, 1, 1, 1): Keycode.ENTER,
(2, 3, 2, 1):       Keycode.UP_ARROW,
(2, 1):             Keycode.DOWN_ARROW,
(1, 1, 1, 1, 2, 1): Keycode.RIGHT_ARROW,
(1, 4, 2, 1):       Keycode.LEFT_ARROW,
}

modifiers = {
(1, 2, 2, 1, 1, 1):   Keycode.RIGHT_SHIFT,
(1, 2, 1, 3):         Keycode.LEFT_SHIFT,
(2, 1, 1, 1):         Keycode.RIGHT_CONTROL,
(1, 3, 1, 3):         Keycode.LEFT_CONTROL,
(1, 1, 1, 3):         Keycode.LEFT_CONTROL,
}