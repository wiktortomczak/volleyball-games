def protobuf_repositories():
  native.local_repository(
    name = "protobuf",
    path = "/home/wiktor/grpc-web/third_party/grpc/third_party/protobuf"
  )

  native.bind(
    name = "protobuf_headers",
    actual = "@protobuf//:protobuf_headers"
  )

  native.bind(
    name = "python_headers",
    actual = "@protobuf//util/python:python_headers"
  )

  native.local_repository(
    name = "grpc",
    path = "/home/wiktor/grpc-web/third_party/grpc",
  )

  native.bind(
    name = "grpc_python_plugin",
    actual = "@grpc//:grpc_python_plugin"
  )
  
  native.new_http_archive(
    name = "six_archive",
    url = "https://pypi.python.org/packages/source/s/six/six-1.10.0.tar.gz#md5=34eed507548117b2ab523ab14b2f8b55",
    build_file = "@protobuf//:six.BUILD",
    sha256 = "105f8d68616f8248e24bf0e9372ef04d3cc10104f1980f54d57b2ce73a5ad56a"
  )

  native.bind(
    name = "six",
    actual = "@six_archive//:six"
  )
  
  native.bind(
    name = "protobuf_clib",
    actual = "@protobuf//:protoc_lib",
  )
