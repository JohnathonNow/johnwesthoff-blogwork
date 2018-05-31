#!/usr/bin/env python3

import cherrypy
from cherrypy.lib import static
import os
import random
import urllib
import json
import threading
import time
import string
from datetime import datetime
import signal

TIMEOUT = 30 #timeout for requests, for long polling
rooms = {}
lock = threading.Lock()

def new_room():
    lock.acquire()
    try:
        code = new_code()
        while code in rooms:
            code = new_code()
        rooms[code] = {'messages': [], 'clients': [], 'state': {}, 'v': 1, 'lock': threading.Lock(), 'new_client': False}
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
                rooms[code]['new_client'] = True
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

    @cherrypy.expose
    def server_post(self, code, state):
        if code not in rooms:
            return json.dumps({'status': 'failure', 'reason': 'invalid room code'})
        rooms[code]['lock'].acquire()
        try:
            rooms[code]['state'] = state
            rooms[code]['v'] += 1
            return json.dumps({'status': 'success'})
        finally:
            rooms[code]['lock'].release()

    @cherrypy.expose
    def user_info(self, code, v):
        if code not in rooms:
            return json.dumps({'status': 'failure', 'reason': 'invalid room code'})
        rooms[code]['lock'].acquire()
        try:
            ct = datetime.now()
            while int(v) >= int(rooms[code]['v']): #wait for new data
                rooms[code]['lock'].release()
                time.sleep(0.1) #let someone else try to do something
                rooms[code]['lock'].acquire()
                lt = datetime.now()
                #if we wait too long, let our client just start a new request
                if int((lt - ct).total_seconds()) >= TIMEOUT:
                    return json.dumps({'status': 'failure', 'reason': 'timeout'})
            return json.dumps({'status': 'success',
                               'state': rooms[code]['state'],
                               'v': rooms[code]['v']})
        finally:
            rooms[code]['lock'].release()
            
    @cherrypy.expose
    def server_info(self, code):
        if code not in rooms:
            return json.dumps({'status': 'failure', 'reason': 'invalid room code'})
        rooms[code]['lock'].acquire()
        try:
            ct = datetime.now()
            while (not rooms[code]['new_client']) and (not rooms[code]['messages']):
                rooms[code]['lock'].release()
                time.sleep(0.1) #let someone else try to do something
                rooms[code]['lock'].acquire()
                lt = datetime.now()
                #if we wait too long, let our client just start a new request
                if int((lt - ct).total_seconds()) >= TIMEOUT:
                    return json.dumps({'status': 'failure', 'reason': 'timeout'})
            rooms[code]['new_client'] = False
            messages = rooms[code]['messages']
            rooms[code]['messages'] = []
            return json.dumps({'status': 'success', 'messages': messages, 'clients': rooms[code]['clients']})
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
    cherrypy.server.socket_port = 8777
    cherrypy.server.shutdown_timeout = 1
    cherrypy.quickstart(Page(), '/', conf)
