#!/usr/bin/env python3
import os, os.path
import random
import json
import threading
import string
import time
from datetime import datetime

import cherrypy

class Sketch(object):
    @cherrypy.expose
    def index(self):
        return open('public/index.html')

draw_state = {"image": "", "version": 0}
draw_lock = threading.Lock()
game_state = {"guesses": [], "word": "", "turn": 0, "players": [], "version": 0}
game_lock = threading.Lock()

TIMEOUT = 30

@cherrypy.expose
class GuessWebApp(object):
    exposed = True
    def __init__(self):
        pass

    def GET(self,version=0):
        ct = datetime.now() #get the start time, for long polling
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
            return json.dumps(response) #send over the data
        except Exception as E:
            #file an error report
            response['status'] = 'failure'
            response['reason'] = str(E)
            return json.dumps(response)
        finally: #whenever we leave, no matter what we must release the lock
            game_lock.release()

    def POST(self, version=0):
        return self.GET(version)

    def PUT(self, name, guess):
        game_lock.acquire()
        try:
            game_state["guesses"].append({"name": name, "guess": guess})
            game_state["version"] += 1
        finally:
            game_lock.release()
        return "ok"

    def DELETE(self):
        return "ok"

@cherrypy.expose
class SketchWebApp(object):
    exposed = True
    def __init__(self):
        pass

    def GET(self, version=0):
        return json.dumps(draw_state)

    def POST(self, version=0):
        return json.dumps(draw_state)

    def PUT(self, img):
        draw_state['image'] = img
        return "ok"

    def DELETE(self):
        return "ok"


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
    cherrypy.quickstart(webapp, '/', conf)

