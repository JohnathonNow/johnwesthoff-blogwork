import tile
import word
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
        total = self.size*self.size
        blues = self.spies
        reds = self.spies + 1
        assassins = self.assassins
        bystanders = self.bystanders
        while total:
            prob_assassin = assassins / total
            prob_blue = blues / total + prob_assassin
            prob_red = reds / total + prob_blue
            a = random.random()
            if a <= prob_assassin:
                alignment = 'ASSASSIN'
                assassins -= 1
            elif a <= prob_blue:
                alignment = 'BLUE'
                blues -= 1
            elif a <= prob_red:
                alignment = 'RED'
                reds -= 1
            else:
                alignment = 'BYSTANDER'
                bystanders -= 1
            total -= 1
            yield tile.Tile(self.deck.draw(), alignment)

    def generate(self):
        tiles = list(self.draw())
        self.grid = [tiles[c*self.size:(c+1)*self.size] for c in range(0, self.size)]

    def __str__(self):
        return '\n'.join([' '.join(str(x) for x in row) for row in self.grid])
