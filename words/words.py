class PuzzleGenerator(object):
    def __init__(self, words):
        self.words = [Word(word, i) for i, word in enumerate(words, start=1)]

    def generate(self, word):
        key = {}
        answers = []
        difficulty = 0
        for c in word:
            key[c] = key.get(c, 0) + 1

        for candidate in self.words:
            works = True
            for c in candidate.word:
                if candidate.letters[c] > key.get(c, 0):
                    works = False
                    break
            if works:
                answers.append(candidate)
                difficulty += candidate.rank
        return Puzzle(word, answers, difficulty)

class Word(object):
    def __init__(self, word, rank=0):
        toadd = {}
        for c in word:
            toadd[c] = toadd.get(c, 0) + 1
        self.letters = toadd
        self.word = word
        self.rank = rank
    def __str__(self):
        return f"<{self.word} - {self.rank}>"
    def __repr__(self):
        return self.__str__()

class Puzzle(object):
    def __init__(self, letters, answers, difficulty):
        self.letters = letters
        self.answers = answers
        self.difficulty = difficulty
    def __str__(self):
        words = ', '.join([f"'{x.word}'" for x in self.answers])
        return f"{{'difficulty': {self.difficulty}, 'key': \'{self.letters}\', 'words': [{words}]}}"
    def __repr__(self):
        return self.__str__()

with open('words.txt') as f:
    words = [s.strip() for s in f.readlines() if len(s) > 3]

a = PuzzleGenerator(words)
puzzles = [a.generate(word) for word in words if len(word) == 8]
for puzzle in sorted(puzzles, key = (lambda x: x.difficulty)):
    print(puzzle)
