class Tile:
    def __init__(self, word, alignment):
        self.word = word
        self.alignment = alignment

    def __str__(self):
        return '<Tile: Holding {} as {}>'.format(str(self.word), self.alignment)
