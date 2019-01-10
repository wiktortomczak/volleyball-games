#!/bin/bash
# Compiles and bundles frontend JS code into a single file
# to be run in a browser:
# build/fe/vbreg.bin.js or build/fe/testing/vbreg-test.bin.js
# TODO: Use Closure compiler features: minify, type-check, etc.
# TODO: Replace with BUILD rule(s).

set -euo pipefail

rm -rf build
mkdir -p build/fe
# mkdir -p build
# mkdir -p build/base
# mkdir -p build/base/proto
# mkdir -p build/testing
# mkdir -p build/third_party/react-router-hash-link@1.2.1

ITRADER=$HOME/itrader
CLOSURE_LIBRARY=$HOME/.cache/bazel/_bazel_wiktor/32acc0e70aa57664f5590efb17a0944e/external/closure_library
PROTOBUF=$HOME/.cache/bazel/_bazel_wiktor/32acc0e70aa57664f5590efb17a0944e/external/protobuf_js
GRPC_WEB=/home/wiktor/grpc-web
GRPC_WEB_PLUGIN=$GRPC_WEB/javascript/net/grpc/web/protoc-gen-grpc-web
(cd $ITRADER; bazel build @protobuf//:protoc)
PROTOC=$ITRADER/bazel-bin/external/protobuf/protoc

# build/vbreg_pb.js
mkdir -p build
$PROTOC -I=src -I=$ITRADER --js_out=library=vbreg_pb:build src/vbreg.proto
# # build/vbreg_grpc_web_pb.js
# mkdir -p build
# $PROTOC -I=src -I=$ITRADER --plugin=protoc-gen-grpc-web=$GRPC_WEB_PLUGIN --grpc-web_out=mode=grpcwebtext:build src/vbreg.proto
# sed -e '4i * @suppress {extraRequire, unusedPrivateMembers}' -i build/vbreg_grpc_web_pb.js
# sed -e '/proto.GamesData.PlayerAcronymsLastSeqNumEntry/s/^/\/\/ /' -i build/vbreg_grpc_web_pb.js
# build/base/timestamp_pb.js
cp vbreg_grpc_web_pb.js build
mkdir -p build/base
$PROTOC -I=$ITRADER --js_out=library=timestamp_pb:build/base $ITRADER/base/timestamp.proto
# build/base/proto/empty_message_pb.js
mkdir -p build/base/proto
$PROTOC -I=$ITRADER --js_out=library=empty_message_pb:build/base/proto $ITRADER/base/proto/empty_message.proto

(cd $ITRADER; bazel build base/js/npm_packages:babel,transform-react-jsx)
function transpile_jsx_to_js() {
  local -r jsx=$1
  local -r js=$2
  unlink node_modules || true
  mkdir -p $(dirname $js)
  RUNFILES_DIR=$ITRADER/bazel-bin TEST_WORKSPACE=/ $ITRADER/base/js/babel_transform_react_jsx.sh $jsx $js
}
JSX=(
  src/fe/cancelation-fees.jsx
  src/fe/commitable-input.jsx
  src/fe/facebook-view.jsx
  src/fe/game.jsx
  src/fe/games-view.jsx
  src/fe/instructions-view.jsx
  src/fe/intro-view.jsx
  src/fe/loading.jsx
  src/fe/logged-in-route.jsx
  src/fe/login-required.jsx
  src/fe/modal-dialog.jsx
  src/fe/players-view.jsx
  src/fe/profile-view.jsx
  src/fe/view.jsx
  src/fe/testing/mock-auth-view.jsx
)
for jsx in ${JSX[@]}; do
  js=build/${jsx#src/}  # Strip src/ prefix if such, prefix with build/.
  js=${js%.jsx}.js      # Strip .jsx suffix. Add .js suffix.
  transpile_jsx_to_js $jsx $js
done

# build/config.js
cat <<EOF > build/config.js
import 'goog:proto.Configuration';

export default proto.Configuration.fromObject(
$(cat src/config.pbobj)
);
EOF

# build/fe/vbreg.bin.js
# build/fe/testing/vbreg-test.bin.js
(cd $ITRADER; bazel build @closure_compiler//:compiler)
for vbreg in $@; do
  $ITRADER/bazel-bin/external/closure_compiler/compiler  \
    --js_output_file=build/fe/${vbreg}.bin.js  \
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
    --entry_point=src/fe/${vbreg}.js  \
    --js='src/fe/**.js'  \
    --js='!src/fe/*.externs.js'  \
    --js=build  \
    --js=$ITRADER/base/js/arrays.js  \
    --js=$ITRADER/base/js/classes.goog.js  \
    --js=$ITRADER/base/js/classes.js  \
    --js=$ITRADER/base/js/iterators.js  \
    --js=$ITRADER/base/js/log.js  \
    --js=$ITRADER/base/js/objects.goog.js  \
    --js=$ITRADER/base/js/observable.js  \
    --js=$ITRADER/base/js/proto/enum.js  \
    --js=$ITRADER/base/js/stream.js  \
    --js=$ITRADER/base/js/time.js  \
    --js=$CLOSURE_LIBRARY  \
    --js=$PROTOBUF  \
    --js=$GRPC_WEB/javascript  \
    --js_module_root=src  \
    --js_module_root=build  \
    --js_module_root=$ITRADER  \
    --extern_module=npm:react:$ITRADER/base/js/npm_packages/react.externs.js  \
    --extern_module=npm:react-dom:$ITRADER/base/js/npm_packages/react-dom.externs.js  \
    --extern_module=npm:react-router-dom:$ITRADER/frontend/npm_packages/react-router-dom.externs.js  \
    --extern_module=npm:prop-types:$ITRADER/base/js/npm_packages/prop-types.externs.js  \
    --extern_module=npm:moment:$ITRADER/base/js/npm_packages/moment.externs.js  \
    --extern_module=npm:fb:src/fe/fb.externs.js  \
    --extern_module=npm:dialog-polyfill:src/fe/dialog-polyfill.externs.js
done
