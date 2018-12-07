#!/usr/bin/env python2.7

import threading
from base import grpc_util
import games


def main():
  grpc_server = grpc_util.GRPCServer.Create(games.Games.Create())
  grpc_server.Start()
  threading.Event().wait()


if __name__ == '__main__':
  from base import setup
  main()
