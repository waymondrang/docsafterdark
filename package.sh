#!/bin/bash

if [ $# -eq 0 ]; then
    echo "no version provided"
    read -n 1
    exit 1
fi

echo "creating chrome release"

cd src/chrome/

zip -r "dad_${1}_chrome.zip" ./*

cd -

mv "./src/chrome/dad_${1}_chrome.zip" ./releases

echo "creating firefox release"

cd src/firefox/

zip -r "dad_${1}_firefox.zip" ./*

cd -

mv "./src/firefox/dad_${1}_firefox.zip" ./releases

echo "creating opera release"

cd src/opera/

zip -r "dad_${1}_opera.zip" ./*

cd -

mv "./src/opera/dad_${1}_opera.zip" ./releases