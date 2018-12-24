#!/usr/bin/env python2.7

import sys
sys.path = sys.path[1:]  # Do not resolve imports in this file's directory.

import threading
from base import grpc_util

from src.be import games


def main():
  grpc_server = grpc_util.GRPCServer.Create(games.Games.Create())
  grpc_server.Start()
  threading.Event().wait()


if __name__ == '__main__':
  from base import setup
  main()
