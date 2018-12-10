#!/bin/bash

set -euo pipefail

[[ -n $HOSTNAME ]] || exit 1
sed -e "s/localhost/$HOSTNAME/g" -i /nginx/nginx.conf
/nginx/nginx -p /nginx -c /nginx/nginx.conf

/games_main/games_main --games_data=/games_main/data/games_data.pbtxt
