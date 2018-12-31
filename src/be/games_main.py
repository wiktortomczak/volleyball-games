# Backend executable. See main().

# Do not resolve imports in this file's directory.
# Make this app's modules importable only via full package name,
# eg. 'src.be.email', so that unqualified module names eg. 'email'
# refer unambigously to Python standard library modules.
import sys
sys.path = sys.path[1:]  

import threading
from base import grpc_util

from src.be import games


def main():
  """Runs gRPC server hosting Games gRPC service. Does not return."""
  grpc_server = grpc_util.GRPCServer.Create(games.Games.Create())
  grpc_server.Start()
  threading.Event().wait()  # Block to keep gRPC server running.


if __name__ == '__main__':
  from base import setup
  main()
