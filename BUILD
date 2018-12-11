
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
  srcs = [
    "config.py",
    "games.py",
  ],
  deps = [
    ":vbreg_proto",
    "//base:bazel_util",
    "//base:list_util",
    "//base:time_util",
    "//base/proto:empty_message_proto",
    "//base/proto:persistent_proto",
    "//base/proto/sync:observable",
  ],
  data = [":vbreg.pbobj"]
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
