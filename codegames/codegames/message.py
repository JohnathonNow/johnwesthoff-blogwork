import json


class Message:
    def __init__(self, data={}):
        self.__dict__.update(data)

    def __repr__(self):
        return 'Message({})'.format(self.__dict__)

    def __str__(self):
        return '<Message: {}>'.format(json.dumps(self.__dict__))
