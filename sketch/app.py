#!/usr/bin/env python3
import os, os.path
import random
import json
import threading
import string
import time
from datetime import datetime
from collections import defaultdict

import cherrypy

class Sketch(object):
    @cherrypy.expose
    def index(self):
        return open('public/index.html')

draw_state = {"image": "", "version": 0}
draw_lock = threading.Lock()
game_state = {"turn": 0, "players": [], "version": 0, "drawer": "", "players": []}
player_time = {}
player_queue = defaultdict(list)

word = ""

game_lock = threading.Lock()

TIMEOUT = 30

def send(to, mfrom, message):
    if to in player_queue:
        player_queue[to].append({"name":mfrom, "message":message})

def broadcast(name, message):
    for p in game_state["players"]:
        player_queue[p].append({"name":name, "message":message})

@cherrypy.expose
class GuessWebApp(object):
    exposed = True
    def __init__(self):
        pass

    def GET(self,version=0,name=''):
        ct = datetime.now() #get the start time, for long polling
        if name not in player_queue:
            return json.dumps({'status': 'failure', 'reason': 'invalid name'})
        response = {'status': 'success', 'payload': game_state}
        try:
            game_lock.acquire()
            while int(version) >= int(game_state['version']): #wait for new data
                game_lock.release()
                time.sleep(0.1) #let someone else try to do something
                game_lock.acquire()
                lt = datetime.now()
                #if we wait too long, let our client just start a new request
                if int((lt - ct).total_seconds()) >= TIMEOUT:
                    response['status'] = 'failure'
                    response['reason'] = 'timeout'
                    break
            response["messages"] = player_queue[name]
            return json.dumps(response) #send over the data
        except Exception as E:
            #file an error report
            response['status'] = 'failure'
            response['reason'] = str(E)
            return json.dumps(response)
        finally: #whenever we leave, no matter what we must release the lock
            player_queue[name] = []
            game_lock.release()

    def POST(self, name):
        with game_lock:
            player_time[name] = 3
            if name not in game_state["players"]:
                game_state["players"].append(name)
            game_state["version"] += 1
            broadcast("", name + " has joined.")

    def PUT(self, name, guess):
        with game_lock:
            player_time[name] = 3
            broadcast(name, guess)
            game_state["version"] += 1
            return "ok"

    def DELETE(self):
        return "ok"

@cherrypy.expose
class SketchWebApp(object):
    exposed = True
    def __init__(self):
        pass

    def GET(self, version=0):
        ct = datetime.now() #get the start time, for long polling
        response = {'status': 'success', 'payload': draw_state}
        try:
            draw_lock.acquire()
            while int(version) >= int(draw_state['version']): #wait for new data
                draw_lock.release()
                time.sleep(0.1) #let someone else try to do something
                draw_lock.acquire()
                lt = datetime.now()
                #if we wait too long, let our client just start a new request
                if int((lt - ct).total_seconds()) >= TIMEOUT:
                    response['status'] = 'failure'
                    response['reason'] = 'timeout'
                    break
            return json.dumps(response) #send over the data
        except Exception as E:
            #file an error report
            response['status'] = 'failure'
            response['reason'] = str(E)
            return json.dumps(response)
        finally: #whenever we leave, no matter what we must release the lock
            draw_lock.release()

    def POST(self, version=0):
        return self.GET(version)

    def PUT(self, img):
        with draw_lock:
            draw_state['image'] = img
            draw_state['version'] += 1
            return "ok"

    def DELETE(self):
        return "ok"


def gameThread():
    turn_time = 0
    player_turns = {}
    while True:
        with game_lock:
            if turn_time <= 0 and len(game_state["players"]) > 1:
                turn_time = 60
                game_state["turn"] += 1
                game_state["drawer"] = game_state["players"][game_state["turn"]%len(game_state["players"])]
                broadcast("", game_state["drawer"] + " will be drawing.");
                word = "bus"
                send(game_state["drawer"], "", "Your word is {}!".format(word));
                game_state["version"] += 1

                toRemove = []
                for p in game_state["players"]:
                    player_time[p] -= 1
                    if player_time[p] <= 0: 
                        toRemove.append(p)

                for p in toRemove:
                    player_queue.pop(p, None)
                    player_time.pop(p, None)
                    game_state["players"].remove(p)
                    broadcast("", p + " has left.");
            turn_time -= 1
        time.sleep(1)


if __name__ == '__main__':
    conf = {
        '/': {
            'tools.sessions.on': True,
            'tools.staticdir.root': os.path.abspath(os.getcwd()),
            'tools.staticdir.dir': './public',
        },
        '/guess': {
            'request.dispatch': cherrypy.dispatch.MethodDispatcher(),
        },
        '/rest': {
            'request.dispatch': cherrypy.dispatch.MethodDispatcher(),
        },
        '/static': {
            'tools.staticdir.on': True,
            'tools.staticdir.dir': './public/',
        }
    }

    webapp = Sketch()
    webapp.rest = SketchWebApp()
    webapp.guess = GuessWebApp()
    t = threading.Thread(target=gameThread)
    t.daemon = True
    t.start()
    cherrypy.quickstart(webapp, '/', conf)

