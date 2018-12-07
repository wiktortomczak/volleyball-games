
from base.proto import empty_message_pb2
import vbreg_pb2
import vbreg_pb2_grpc


class Games(vbreg_pb2_grpc.GamesServicer):

  @classmethod
  def Create(cls):
    # TODO
    return cls()

  def StreamData(self, request, context):
    print '### StreamData %s' % request,
    try:
      while True:
        # Throws GeneratorExit when the request is terminated by the client.
        yield vbreg_pb2.GamesData()
        # TODO
        import time
        time.sleep(1)
    finally:
      print '### StreamData end'

  def PlayerAdd(self, request, context):
    print '### PlayerAdd %s' % request,
    return empty_message_pb2.EmptyMessage()
