#!/bin/bash

if [ $# -eq 0 ]; then
    echo "no message provided"
    read -n 1
    exit 1
fi

git status
git add *
git commit -m " ${1} "
git push origin main