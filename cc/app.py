#!/usr/bin/env python3
import os
import os.path
import random
import threading
from datetime import datetime
from collections import defaultdict
from cherrypy import tools

import cherrypy


class CC(object):
    @cherrypy.expose
    def index(self):
        return open('public/index.html')


lock = threading.Lock()
log_file = open('log.txt', 'a+')


def append_file(name, i, j, r):
    with lock:
        log_file.write(f'{name}, {i}, {j}, {r}\n')
        log_file.flush()


def get_pair():
    i = random.randint(0, 28)
    j = i
    while j == i:
        j = random.randint(0, 28)
    return {'i': i, 'j': j}


@cherrypy.expose
class WebApp(object):
    exposed = True

    @cherrypy.tools.json_out()
    def GET(self, name='', i=0, j=0, r=0):
        if str(r) != '-1':
            append_file(name, i, j, r)
        return {'status': 'success', 'payload': get_pair()}


if __name__ == '__main__':

    cherrypy.server.socket_host = '0.0.0.0'
    cherrypy.server.socket_port = 80
    cherrypy.server.shutdown_timeout = 1

    conf = {
        '/': {
            # 'tools.sessions.on': True,
            'tools.staticdir.root': os.path.abspath(os.getcwd()),
            'tools.staticdir.dir': './public',
        },
        '/submit': {
            # 'tools.sessions.on': True,
            'request.dispatch': cherrypy.dispatch.MethodDispatcher(),
        },
        '/static': {
            # 'tools.sessions.on': True,
            'tools.staticdir.on': True,
            'tools.staticdir.dir': './public/',
        }
    }

    webapp = CC()
    webapp.submit = WebApp()
    cherrypy.quickstart(webapp, '/', conf)
