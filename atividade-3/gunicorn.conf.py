workers = 1
threads = 2
# bind controlado pelo Dockerfile (--bind 0.0.0.0:5000)
timeout = 60

def post_fork(server, worker):
    from zmq_listener import start_zmq_listeners
    start_zmq_listeners()
