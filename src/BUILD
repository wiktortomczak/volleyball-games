
load("@protobuf//:protobuf.bzl", "py_proto_library")

py_proto_library(
  name = "vbreg_proto",
  srcs = [
    "vbreg.proto"
  ],
  deps = [
    "//base:timestamp_proto",
    "//base/proto:empty_message_proto"
  ],
  default_runtime = "@protobuf//:protobuf_python",
  protoc = "@protobuf//:protoc",
  use_grpc_plugin = True,
  visibility = ["//visibility:public"]
)

exports_files([
  "config.pbobj"
])
