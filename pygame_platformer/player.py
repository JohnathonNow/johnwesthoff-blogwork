import random
import pygame
import time
import sys
import math
import sprite
import wall

class Player(sprite.Sprite):
    def __init__(self, game, x, y):
        super(Player, self).__init__(game)
        self.rect.move_ip(x, y)
        self.img = pygame.image.load("imgs/player.png").convert_alpha()
        self.rect.inflate_ip(32, 32)
        self.left = 0
        self.right = 0
        self.up = False
        self.jumps = 2

    def tick(self):
        self.vx = (self.right - self.left) * 7

        if self.up:
            w = self.thing_at(wall.Wall, 8, 0) or \
                self.thing_at(wall.Wall, -8, 0) 
            if w:
                self.vx = -7
                self.right = 0
                self.left = 1
                if w.rect.x < self.rect.x:
                    self.vx = 7
                    self.right = 1
                    self.left = 0
                self.jumps = 2
            if self.jumps > 0:
                self.up = False
                self.vy = -20
                self.jumps -= 1

        w = self.thing_at(wall.Wall, self.vx, 0)
        if w:
            if w.rect.x > self.rect.x:
                self.rect.right = w.rect.left
            else:
                self.rect.left = w.rect.right
        else:
            self.rect.x += self.vx

        w = self.thing_at(wall.Wall, 0, self.vy)
        if w:
            if self.vy > 0:
                self.rect.bottom = w.rect.top
                self.jumps = 2
            else:
                self.rect.top = w.rect.bottom
            self.vy = 0
        else:
            self.rect.y += self.vy
            self.vy += 1
            if self.vy > 16:
                self.vy = 16


        self.game.view = (self.game.width/2 - self.rect.x - self.rect.w/2,
                         (self.game.height*5)/8 - self.rect.y - self.rect.h/2)

    def draw(self):
        self.game.screen.blit(self.img, self.rect.move(*self.game.view))
        pygame.draw.rect(self.game.screen, (255, 0, 0),
                         self.rect.move(*self.game.view), 1)
        

    def handleKeyDown(self, k):
        if k == 'a':
            self.left = 1
        elif k == 'd':
            self.right = 1
        elif k == 'w':
            self.up = True

    def handleKeyUp(self, k):
        if k == 'a':
            self.left = 0
        elif k == 'd':
            self.right = 0
        elif k == 'w':
            self.up = False


    def handleMDOWN(self, xxt, yyt):
        pass

    def handleMUP(self, xxt, yyt):
        pass
