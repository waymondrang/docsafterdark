#!/bin/bash

if [ $# -eq 0 ]; then
    echo "missing arguments"
    read -n 1
    exit 1
fi

echo "creating ${3} release"

cd ${4}

zip -r "${2}_${1}_${3}.zip" ./*

cd -

mv "${4}/${2}_${1}_${3}.zip" ${5}