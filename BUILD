
load("@protobuf//:protobuf.bzl", "py_proto_library")

py_binary(
  name = "games_main",
  srcs = ["games_main.py"],
  deps = [
    ":games",
    "//base:grpc_util",
    "//base:setup"
  ]
)

py_library(
  name = "games",
  srcs = ["games.py"],
  deps = [
    ":vbreg_proto",
    "//base/proto:empty_message_proto"
  ]
)

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
  use_grpc_plugin = True
)
