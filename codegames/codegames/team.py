from . import word
import random

class Deck:
    def __init__(self, alignment, words):
        self.alignment = alignment
        self.words = words
        self.team = []
        self.team_map = {}
        self.clues = []
        self.spymaster = None

    def join(self, p):
        p.team = self
        self.team.append(p)
        self.team_map[p.name] = p

    def quit(self, p):
        p.team = None
        self.team.remove(p)
        del self.team_map[p.name]

    def get_spymaster(self):
        if self.spymaster == None or not self.team:
            return None
        else:
            return self.team[self.spymaster]

    def next_spymaster(self):
        if self.team:
            self.spymaster = ((self.spymaster or 0) + 1) % len(self.team)
        else:
            self.spymaster = None

    def __str__(self):
        ps = ', '.join([str(x) for x in self.team])
        return 'Team: {} [{}]'.format(self.alignment, ps)
