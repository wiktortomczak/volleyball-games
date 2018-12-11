from google.protobuf import js_object_format
from base import resources

import vbreg_pb2

config = js_object_format.Parse(
  file(resources.GetResourcePath('vbreg.pbobj')).read(),
  vbreg_pb2.Configuration())
