import random
import pygame
import time
import sys
import math
import sprite

# class for the spikes and wall
class Terrain(sprite.Sprite):
    def __init__(self, game, x, y):
        super(Terrain, self).__init__(game)
        self.rect.move_ip(x, y)
        self.rect.inflate_ip(32, 32)

    def tick(self):
        return False

class Wall(Terrain):
    def __init__(self, game, x, y):
        super(Wall, self).__init__(game, x, y)

    def draw(self):
        pygame.draw.rect(self.game.screen, (0, 0, 0),
                         self.rect.move(*self.game.view), 1)

