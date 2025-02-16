#!/usr/bin/env python
from cherrypy import tools

import cherrypy

@cherrypy.expose
class ScoringApp(object):
    exposed = True
    def __init__(self):
        pass

    @cherrypy.tools.json_out()
    def GET(self,path):
        return {}

if __name__ == '__main__':
    cherrypy.server.socket_host = '127.0.0.1'
    cherrypy.server.socket_port = 9991
    cherrypy.server.shutdown_timeout = 1
    conf = {
        '/': {
            'request.dispatch': cherrypy.dispatch.MethodDispatcher(),
        }
    }
    webapp = ScoringApp()
    cherrypy.quickstart(webapp, '/', conf)

