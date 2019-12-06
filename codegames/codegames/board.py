from . import tile
from . import word
from . import constants
import random

class Board:
    def __init__(self, deck, size=5, assassins=1, spies=7):
        self.size = size
        self.spies = spies
        self.assassins = assassins
        self.bystanders = size*size - (spies*2 + 1 + assassins)
        self.deck = deck
        self.generate()

    def draw(self):
        aligns = ([constants.ASSASSIN]  * self.assassins + 
                  [constants.BLUE]      * self.spies +
                  [constants.RED]       * (self.spies + 1) +
                  [constants.BYSTANDER] * self.bystanders)
        random.shuffle(aligns)
        while aligns:
            yield tile.Tile(self.deck.draw(), aligns.pop())

    def generate(self):
        tiles = list(self.draw())
        self.grid = [tiles[c*self.size:(c+1)*self.size] for c in range(0, self.size)]

    def __str__(self):
        return '\n'.join([' '.join(str(x) for x in row) for row in self.grid])
