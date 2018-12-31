
from google.protobuf import js_object_format
from base import resources

from src import vbreg_pb2

# Compile-time frontend-backend configuration as native Python proto.
CONFIG = js_object_format.Parse(
  file(resources.GetResourcePath('src/config.pbobj')).read(),
  vbreg_pb2.Configuration())
