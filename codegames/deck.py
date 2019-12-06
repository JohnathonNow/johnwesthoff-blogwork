import word
import random

class Deck:
    def __init__(self, fname):
        self.cards = []
        self.discard = []
        self.read_deck_file(fname)
        self.shuffle()

    def read_deck_file(self, fname):
        with open(fname) as f:
            self.cards = [word.Word(s) for s in f]

    def shuffle(self):
        random.shuffle(self.cards)

    def draw(self):
        card = self.cards.pop()
        self.discard.append(card)
        return card

    def __str__(self):
        top = ', '.join([str(x) for x in self.cards[-5:]])
        return 'Deck: with {} cards [{}...]'.format(len(self.cards), top)
