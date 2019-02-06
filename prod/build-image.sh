#!/bin/bash

set -euo pipefail

./build-fe.sh vbreg
bazel build --package_path %workspace%:/home/wiktor/itrader src/be:games_main
rm -f $(find bazel-bin/src/be/games_main.runfiles -name '*.pyc')
rm -f $(find -name '*~')

CONTEXT=(
  prod/vbreg.Dockerfile
  prod/vbreg.sh
  prod/nginx/
  build/www/
  bazel-bin/src/be/games_main
  bazel-bin/src/be/games_main.runfiles
)
tar -ch ${CONTEXT[@]} | \
  docker build -f prod/vbreg.Dockerfile -t eu.gcr.io/itrader-1/vbreg -
