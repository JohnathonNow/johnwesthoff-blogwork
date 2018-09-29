#!/usr/bin/env python3
import os, os.path
import random
import json
import threading
import string
import time
import Levenshtein
from datetime import datetime
from collections import defaultdict
from cherrypy import tools

import cherrypy

class Sketch(object):
    @cherrypy.expose
    def index(self):
        return open('public/index.html')

draw_state = {"image": "", "version": 0}
draw_lock = threading.Lock()
game_state = {"turn": 0, "players": [], "version": 0, "drawer": "", "scores": {}, "time": 0, "correct": []}
player_time = {}
player_queue = defaultdict(list)

word = ""

game_lock = threading.Lock()

TIMEOUT = 30

def send(to, mfrom, message, kind="guess"):
    if to in player_queue:
        player_queue[to].append({"name":mfrom, "message":message, "kind":kind})

def broadcast(name, message, kind="guess"):
    for p in game_state["players"]:
        player_queue[p].append({"name":name, "message":message, "kind":kind})

@cherrypy.expose
class GuessWebApp(object):
    exposed = True
    def __init__(self):
        pass

    @cherrypy.tools.json_out()
    def GET(self,version=0,name=''):
        ct = datetime.now() #get the start time, for long polling
        if name not in player_queue:
            return {'status': 'failure', 'reason': 'invalid name'}
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
            return response #send over the data
        except Exception as E:
            #file an error report
            response['status'] = 'failure'
            response['reason'] = str(E)
            return response
        finally: #whenever we leave, no matter what we must release the lock
            player_time[name] = 3
            player_queue[name] = []
            game_lock.release()

    @cherrypy.tools.json_out()
    def POST(self, name):
        with game_lock:
            if name not in game_state["players"]:
                game_state["players"].append(name)
                game_state["scores"][name] = 0
            else:
            #elif 'name' not in cherrypy.session or cherrypy.session['name'] != name:
                return {'status': 'failure', 'reason': 'name taken'}
            player_time[name] = 3
            #cherrypy.session['name'] = name
            game_state["version"] += 1
            broadcast("", name + " has joined.")
            return {'status': 'success'}

    def PUT(self, name, guess):
        with game_lock:
            if name not in game_state["players"]:
                return {'status': 'failure', 'reason': 'invalid name'}
            player_time[name] = 3
            guessp = guess
            guess = guess.lower()
            if isGuessCorrect(guess):
                if name in game_state["correct"]:
                    send(name, "", "You already got it.")
                elif name == game_state["drawer"]:
                    send(name, "", "You can't guess your own word.")
                else:
                    score_boost = max(1, 10-len(game_state["correct"]))
                    game_state["scores"][name] += score_boost
                    game_state["scores"][game_state["drawer"]] += score_boost
                    game_state["correct"].append(name)
                    broadcast("", "{} got it!".format(name))
            elif isGuessClose(guess):
                send(name, "", "\"{}\" is close!".format(guessp))
                send(game_state["drawer"], name, guessp)
            else:
                broadcast(name, guessp)
            game_state["version"] += 1
            return {'status': 'success'}

    def DELETE(self):
        return "ok"

@cherrypy.expose
class SketchWebApp(object):
    exposed = True
    def __init__(self):
        pass

    @cherrypy.tools.json_out()
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
            return response #send over the data
        except Exception as E:
            #file an error report
            response['status'] = 'failure'
            response['reason'] = str(E)
            return response
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

def isGuessCorrect(guess):
    return guess == word

def isGuessClose(guess):
    return (guess in word and len(guess) > 3) or Levenshtein.distance(str(guess), str(word)) <= 3


def gameThread():
    global word
    player_turns = {}
    while True:
        with game_lock:
            if len(game_state["players"]) == 0:
                game_state["turn"] = 0
                game_state["time"] = 0
            elif (game_state["time"] <= 0 or (len(game_state["players"]) == 1+len(game_state["correct"]))) and len(game_state["players"]) > 1:
                if game_state["turn"] > 0:
                    if len(game_state["correct"]) > 2:
                        broadcast("", "{}, and {} correctly guessed {}'s word {}".format(", ".join(game_state["correct"][:-2]),
                                                                                                   game_state["correct"][-1],
                                                                                                   game_state["drawer"],
                                                                                                   word))
                    elif len(game_state["correct"]) == 2:
                        broadcast("", "{} correctly guessed {}'s word {}".format(" and ".join(game_state["correct"]),
                                                                                           game_state["drawer"],
                                                                                           word))
                    elif len(game_state["correct"]) == 1:
                        broadcast("", "{} correctly guessed {}'s word {}".format(game_state["correct"][0],
                                                                                 game_state["drawer"],
                                                                                 word))
                    else:
                        broadcast("", "Nobody correctly guessed {}'s word {}".format(game_state["drawer"], word))
                with draw_lock:
                    #transparent image
                    draw_state['image'] = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                    draw_state['version'] += 1
                game_state["correct"] = []
                game_state["time"] = 120
                game_state["turn"] += 1
                game_state["drawer"] = game_state["players"][game_state["turn"]%len(game_state["players"])]
                broadcast("", game_state["drawer"] + " will be drawing.");
                with open('words') as f:
                    word = random.choice(f.read().splitlines()).lower()
                send(game_state["drawer"], "", "Your word is {}!".format(word), "word");
                game_state["version"] += 1

                toRemove = []
                for p in game_state["players"]:
                    player_time[p] -= 1
                    if player_time[p] <= 0: 
                        toRemove.append(p)

                for p in toRemove:
                    broadcast("", p + " has left.");
                    game_state["players"].remove(p)
                    player_queue.pop(p, None)
                    player_time.pop(p, None)
            game_state["time"] -= 1
        time.sleep(1)


if __name__ == '__main__':

    cherrypy.server.socket_host = '0.0.0.0'
    cherrypy.server.socket_port = 80
    cherrypy.server.shutdown_timeout = 1

    conf = {
        '/': {
            #'tools.sessions.on': True,
            'tools.staticdir.root': os.path.abspath(os.getcwd()),
            'tools.staticdir.dir': './public',
        },
        '/guess': {
            #'tools.sessions.on': True,
            'request.dispatch': cherrypy.dispatch.MethodDispatcher(),
        },
        '/rest': {
            #'tools.sessions.on': True,
            'request.dispatch': cherrypy.dispatch.MethodDispatcher(),
        },
        '/static': {
            #'tools.sessions.on': True,
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

