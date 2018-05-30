#!/usr/bin/env python3

import cherrypy
from cherrypy.lib import static
import os
import urllib
import json
import threading
import time
from datetime import datetime
import signal

TIMEOUT = 30 #timeout for requests, for long polling
rooms = {}
lock = threading.Lock()

def new_room():
    lock.accquire()
    try:
        code = new_code()
        while code in rooms:
            code = new_code()
        rooms[code] = {'messages': [], 'clients': [], 'state': {}, 'v': 1, 'lock': threading.Lock()}
        return code
    finally:
        lock.release()

def new_code(size=3, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))

class Page(object):

    @cherrypy.expose
    def new_room(self):
        response = {'status': 'success', 'code': new_room()}
        return json.dumps(response)

    @cherrypy.expose
    def user_register(self, code, name):
        if code not in rooms:
            return json.dumps({'status': 'failure', 'reason': 'invalid room code'})
        rooms[code]['lock'].acquire()
        try:
            if name in rooms[code]['clients']:
                return json.dumps({'status': 'failure', 'reason': 'name taken'})
            else:
                rooms[code]['clients'].append(name)
                return json.dumps({'status': 'success', 'id': len(rooms[code]['clients'])})
        finally:
            rooms[code]['lock'].release()

    @cherrypy.expose
    def user_post(self, code, data):
        if code not in rooms:
            return json.dumps({'status': 'failure', 'reason': 'invalid room code'})
        rooms[code]['lock'].acquire()
        try:
            rooms[code]['messages'].append(data)
            return json.dumps({'status': 'success'})
        finally:
            rooms[code]['lock'].release()

if __name__ == '__main__':
    #set up cherrypy
    conf = {
        '/': {
            'tools.sessions.on': True,
            'tools.staticdir.root': os.path.join(os.path.abspath(os.getcwd()), 'static'),
            'tools.staticdir.on': True,
            'tools.staticdir.dir': './',
            'tools.staticdir.index': 'index.html'
        },
        '/assets': {
            'tools.staticdir.on': True,
            'tools.staticdir.dir': './assets'
        }
    }
    cherrypy.server.socket_host = '0.0.0.0'
    cherrypy.server.socket_port = 80
    cherrypy.server.shutdown_timeout = 1
    cherrypy.quickstart(Page(), '/', conf)
