class Player:
    def __init__(self, name):
        self.name = word.strip().lower()
        self.team = None
        self.message_queue = []

    def read(self):
        r = self.message_queue
        self.message_queue = []
        return r

    def send(self, message):
        self.message_queue.append(message.__dict__)

    def __str__(self):
        return 'Player: {}'.format(self.name)
