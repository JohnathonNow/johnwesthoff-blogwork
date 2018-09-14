#!/usr/bin/env python3
import os, os.path
import random
import json
import string
import time

import cherrypy

class Sketch(object):
    @cherrypy.expose
    def index(self):
        return open('public/index.html')

IMG = ""
guesses = []

@cherrypy.expose
class GuessWebApp(object):
    exposed = True
    def __init__(self):
        pass

    def GET(self,version=0):
        return json.dumps(guesses)

    def POST(self, resource=""):
        return json.dumps(guesses)

    def PUT(self, name, guess):
        guesses.append({"name": name, "guess": guess})
        return "ok"

    def DELETE(self):
        return "ok"

@cherrypy.expose
class SketchWebApp(object):
    exposed = True
    def __init__(self):
        pass

    def GET(self,resource=""):
        return IMG

    def POST(self, resource=""):
        return IMG

    def PUT(self, img):
        global IMG
        IMG = img
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

