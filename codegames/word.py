class Word:
    def __init__(self, word):
        self.word = word.strip().lower()

    def __str__(self):
        return 'Word: {}'.format(self.word)
