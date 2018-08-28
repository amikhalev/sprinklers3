#!/usr/bin/env bash

DIR=$(dirname $0)
SESSION_NAME=sprinklers3

tmux has-session -t ${SESSION_NAME}

if [ $? != 0 ]; then
    tmux new-session -s ${SESSION_NAME} -n server -d
    tmux send-keys -t ${SESSION_NAME} "cd ${DIR}" C-m
    tmux send-keys -t ${SESSION_NAME} "yarn start:watch" C-m
    tmux new-window -t ${SESSION_NAME} -n client
    tmux send-keys -t "${SESSION_NAME}:client" "yarn start:dev-server" C-m
fi

tmux attach -t ${SESSION_NAME}

