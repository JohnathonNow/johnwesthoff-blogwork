class Player:
    def __init__(self, name):
        self.name = word.strip().lower()

    def __str__(self):
        return 'Player: {}'.format(self.name)
