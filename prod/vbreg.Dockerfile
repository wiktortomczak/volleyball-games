# CONTEXT=(
#   prod/vbreg.Dockerfile
#   prod/vbreg.sh
#   prod/nginx/
#   html/
#   bazel-bin/src/be/games_main
#   bazel-bin/src/be/games_main.runfiles
# )
# tar -ch ${CONTEXT[@]} | \
#   docker build -f prod/vbreg.Dockerfile -t eu.gcr.io/itrader-1/vbreg -
#
# docker run --name vbreg  --hostname vbreg -ti eu.gcr.io/itrader-1/vbreg

FROM ubuntu:16.04

RUN apt-get update
RUN apt-get install -y libssl1.0.0  # Needed by nginx.
RUN apt-get install -y python python-pip
RUN pip install python-gflags six
RUN pip install grpcio futures pytz tzlocal pandas==0.19.0
RUN pip install promise
RUN pip install sendgrid

# TODO: Build nginx binary linked to nginx/nginx.
COPY prod/nginx /nginx/
RUN mkdir -p /nginx/logs

COPY html /html/
RUN ln -s /html /nginx/html

# TODO: Build games_main. Clean: remove *.pyc from runfiles.
COPY bazel-bin/src/be/games_main /games_main/
COPY bazel-bin/src/be/games_main.runfiles /games_main/games_main.runfiles/
RUN mkdir /games_main/data
VOLUME /games_main/data

COPY prod/vbreg.sh /
ENTRYPOINT ["/vbreg.sh"]
