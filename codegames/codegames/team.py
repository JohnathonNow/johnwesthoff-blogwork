from . import word
import random

class Deck:
    def __init__(self, alignment):
        self.alignment = alignment
        self.team = []
        self.spymaster = None

    def join(self, p):
        self.team.append(p)

    def quit(self, p):
        self.team.remove(p)

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
