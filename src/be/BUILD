
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
    "email.py",
    "games.py",
  ],
  deps = [
    "//base:bazel_util",
    "//base:list_util",
    "//base:thread_pool",
    "//base:time_util",
    "//base/proto:empty_message_proto",
    "//base/proto:persistent_proto",
    "//base/proto/sync:observable",
    "//src:vbreg_proto"
  ],
  data = ["//src:config.pbobj"]
)
