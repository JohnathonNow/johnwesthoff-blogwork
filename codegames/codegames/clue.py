from . import word
class Clue:
    def __init__(self, word, number):
        self.word = word.Word(word)
        self.number = number

    def __str__(self):
        return '<Clue: {} - {}>'.format(str(self.word), self.number)
