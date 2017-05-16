import random
import pygame
import time
import sys
import math

class Sprite(object):
    def __init__(self, game):
        self.rect = pygame.Rect(0, 0, 0, 0)
        self.vx = 0
        self.vy = 0
        self.game = game
        game.objects.append(self)

    def tick(self):
        self.rect.move_ip(self.vx, self.vy)
        
    def draw(self):
        pass

    def die(self):
        pass

    def thing_at(self, c, x, y):
        l1 = [w for w in self.game.objects
                if isinstance(w, c) and self != w]
        l2 = [w.rect for w in l1]
        i = self.rect.move(x, y).collidelist(l2)
        if i == -1:
            return None
        else:
            return l1[i]
