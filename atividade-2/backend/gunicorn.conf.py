workers = 1
threads = 2
# bind controlado pelo Dockerfile (--bind 0.0.0.0:8000)
timeout = 60

def post_fork(server, worker):
    from app import start_zmq_threads
    start_zmq_threads()
