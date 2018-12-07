#!/bin/bash

set -euo pipefail

mkdir -p build
mkdir -p build/base
mkdir -p build/base/proto
mkdir -p build/testing

ITRADER=$HOME/itrader
CLOSURE_LIBRARY=$HOME/.cache/bazel/_bazel_wiktor/32acc0e70aa57664f5590efb17a0944e/external/closure_library
PROTOBUF=$HOME/.cache/bazel/_bazel_wiktor/32acc0e70aa57664f5590efb17a0944e/external/protobuf_js
GRPC_WEB=/home/wiktor/grpc-web
GRPC_WEB_PLUGIN=$GRPC_WEB/javascript/net/grpc/web/protoc-gen-grpc-web
(cd $ITRADER; bazel build @protobuf//:protoc)
PROTOC=$ITRADER/bazel-bin/external/protobuf/protoc

# build/vbreg_pb.js
$PROTOC -I=. -I=$ITRADER --js_out=library=vbreg_pb:build ./vbreg.proto
# # build/vbreg_grpc_web_pb.js
# $PROTOC -I=. -I=$ITRADER --plugin=protoc-gen-grpc-web=$GRPC_WEB_PLUGIN --grpc-web_out=mode=grpcwebtext:build ./vbreg.proto
# build/base/timestamp_pb.js
$PROTOC -I=$ITRADER --js_out=library=timestamp_pb:build/base $ITRADER/base/timestamp.proto
# build/base/proto/empty_message_pb.js
$PROTOC -I=$ITRADER --js_out=library=empty_message_pb:build/base/proto $ITRADER/base/proto/empty_message.proto

(cd $ITRADER; bazel build base/js/npm_packages:babel,transform-react-jsx)
function transpile_jsx_to_js() {
  local -r jsx=$1
  local -r js=$2
  unlink node_modules || true
  RUNFILES_DIR=$ITRADER/bazel-bin TEST_WORKSPACE=/ $ITRADER/base/js/babel_transform_react_jsx.sh $jsx $js
}
# build/view.js
transpile_jsx_to_js view.jsx build/view.js
# build/intro-view.js
transpile_jsx_to_js intro-view.jsx build/intro-view.js
# build/instructions-view.js
transpile_jsx_to_js instructions-view.jsx build/instructions-view.js
# build/games-view.js
transpile_jsx_to_js games-view.jsx build/games-view.js
# build/profile-view.js
transpile_jsx_to_js profile-view.jsx build/profile-view.js
# build/facebook-view.js
transpile_jsx_to_js facebook-view.jsx build/facebook-view.js
# build/cancelation-fees.js
transpile_jsx_to_js cancelation-fees.jsx build/cancelation-fees.js
# build/testing/mock-auth-view.js
transpile_jsx_to_js testing/mock-auth-view.jsx build/testing/mock-auth-view.js

# build/vbreg.bin.js
# build/vbreg-test.bin.js
(cd $ITRADER; bazel build @closure_compiler//:compiler)
for vbreg in $@; do
  $ITRADER/bazel-bin/external/closure_compiler/compiler  \
    --js_output_file=build/${vbreg}.bin.js  \
    --compilation_level=DEPENDENCIES_ONLY  \
    --dependency_mode=STRICT  \
    --module_resolution=LEGACY  \
    --jscomp_error='*'  \
    --jscomp_off=checkTypes  \
    --jscomp_off=lintChecks  \
    --jscomp_off=analyzerChecksInternal  \
    --jscomp_off=checkDebuggerStatement  \
    --warning_level=VERBOSE  \
    --continue_after_errors  \
    --language_in=ECMASCRIPT6_STRICT  \
    --language_out=ES5  \
    --formatting=PRETTY_PRINT  \
    --entry_point=${vbreg}.js  \
    --js=${vbreg}.js  \
    --js=app.js  \
    --js=model.js  \
    --js=facebook.js  \
    --js=auth.js  \
    --js=formatting.js  \
    --js=build/vbreg_pb.js  \
    --js=build/vbreg_grpc_web_pb.js  \
    --js=build/view.js  \
    --js=build/games-view.js  \
    --js=build/intro-view.js  \
    --js=build/instructions-view.js  \
    --js=build/profile-view.js  \
    --js=build/facebook-view.js  \
    --js=build/cancelation-fees.js  \
    --js=build/base/timestamp_pb.js  \
    --js=build/base/proto/empty_message_pb.js  \
    --js=testing/mock-auth.js  \
    --js=testing/mock-games-client.js  \
    --js=build/testing/mock-auth-view.js  \
    --js=$ITRADER/base/js/iterators.js  \
    --js=$ITRADER/base/js/observable.js  \
    --js=$ITRADER/base/js/stream.js  \
    --js=$ITRADER/base/js/log.js  \
    --js=$ITRADER/base/js/classes.js  \
    --js=$ITRADER/base/js/classes.goog.js  \
    --js=$ITRADER/base/js/objects.goog.js  \
    --js=$ITRADER/base/js/time.js  \
    --js=$ITRADER/base/js/proto/enum.js  \
    --js=$CLOSURE_LIBRARY  \
    --js=$PROTOBUF  \
    --js=$GRPC_WEB/javascript  \
    --js_module_root=build  \
    --js_module_root=$ITRADER  \
    --extern_module=npm:react:$ITRADER/base/js/npm_packages/react.externs.js  \
    --extern_module=npm:react-dom:$ITRADER/base/js/npm_packages/react-dom.externs.js  \
    --extern_module=npm:react-router-dom:$ITRADER/frontend/npm_packages/react-router-dom.externs.js  \
    --extern_module=npm:prop-types:$ITRADER/base/js/npm_packages/prop-types.externs.js  \
    --extern_module=npm:fb:fb.externs.js  \
    --extern_module=npm:moment:$ITRADER/base/js/npm_packages/moment.externs.js
done
