#!/bin/sh

MODE=prod
export MODE

if ["$MODE" -lt "dev"]; then
    docker compose up --build
fi

for dir in ./src/*/*_test.js; do
    printf '%s\n' "$dir"
done