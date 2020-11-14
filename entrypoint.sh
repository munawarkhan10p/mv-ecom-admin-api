#!/usr/bin/env bash
    echo "i am here"
if [[ "$NODE_ENV" == "development" ]]; then
  ./wait-for-it.sh $DB_HOST:$DB_PORT
    echo "i am here inside"
  yarn typeorm schema:sync
  if [ $? -ne 0 ]; then
    echo "Database sync failed :("
    exit 1
  fi

  yarn typeorm migration:run
  if [ $? -ne 0 ]; then
    echo "Migration failed :("
    exit 1
  fi
fi

eval "$@"
