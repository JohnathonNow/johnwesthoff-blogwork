from . import deck
from . import board

class Game:
    def __init__(self, fname):
        d = deck.Deck(fname)
        self.board = board.Board(d)

    def __str__(self):
        return str(self.board)
