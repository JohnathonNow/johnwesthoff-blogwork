#!/usr/bin/python2 -B
import random
import pygame
import sys
import os
import player
import wall

class Game:
    def __init__(self):
        self.objects = []
        self.width = 600
        self.height = 600
        self.screen = pygame.display.set_mode((self.width, self.height))
        self.player = player.Player(self, 100, 100)
        self.view = (0, 0)
        for x in xrange(0, 320, 32):
            wall.Wall(self, x, 640)
        for y in xrange(0, 640, 32):
            wall.Wall(self, 0, y)
            wall.Wall(self, 160, y)

    def tick(self):
        for b in self.objects:
            if b.tick():
               b.die()
               self.objects.remove(b)

    def draw(self):
        self.screen.fill((244, 244, 244))
        for b in reversed(self.objects):
            b.draw()

    def handleKeyDown(self, k):
        self.player.handleKeyDown(k)

    def handleKeyUp(self, k):
        self.player.handleKeyUp(k)

    def handleMUP(self, xxt, yyt):
        self.player.handleMUP(xxt, yyt)

    def handleMDOWN(self, xxt, yyt):
        self.player.handleMDOWN(xxt, yyt)

if __name__ == "__main__":
    pygame.init()
    clock = pygame.time.Clock()
    game = Game()
    while True:
        # handle the pygame events
        for event in pygame.event.get():
            if event.type == pygame.QUIT: 
                pygame.quit()
            elif event.type == pygame.MOUSEBUTTONUP:
                mx, my = event.pos
                game.handleMUP(mx, my)
            elif event.type == pygame.MOUSEBUTTONDOWN:
                mx, my = event.pos
                game.handleMDOWN(mx, my)
            elif event.type == pygame.KEYUP:
                k = pygame.key.name(event.key)
                game.handleKeyUp(k)
            elif event.type == pygame.KEYDOWN:
                k = pygame.key.name(event.key)
                game.handleKeyDown(k)
                if "q" in k:
                    pygame.quit()
        game.tick()
        game.draw()
        pygame.display.flip()
        clock.tick(60)
