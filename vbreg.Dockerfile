# tar -ch vbreg.Dockerfile vbreg.sh nginx/ html/ bazel-bin/games_main bazel-bin/games_main.runfiles | \
#   docker build -f vbreg.Dockerfile -t vbreg -
#
# docker run --name vbreg  --hostname vbreg -ti vbreg

FROM ubuntu:16.04

RUN apt-get update
RUN apt-get install -y libssl1.0.0  # Needed by nginx.
RUN apt-get install -y python python-pip
RUN pip install python-gflags six
RUN pip install grpcio futures pytz tzlocal pandas==0.19.0
RUN pip install promise

# TODO: Build nginx binary linked to nginx/nginx.
COPY nginx /nginx/
RUN mkdir -p /nginx/logs

COPY html /html/
RUN ln -s /html /nginx/html

# TODO: Build games_main. Clean: remove *.pyc from runfiles.
COPY bazel-bin/games_main /games_main/
COPY bazel-bin/games_main.runfiles /games_main/games_main.runfiles/
RUN mkdir /games_main/data
VOLUME /games_main/data

COPY vbreg.sh /
ENTRYPOINT ["/vbreg.sh"]
