if [ $# -eq 0 ]; then
    echo "no version provided"
    read -n 1
    exit 1
fi

echo "creating chrome release"

zip -j "./releases/dad_${1}_chrome.zip" ./src/chrome/*

echo "creating firefox release"

zip -j "./releases/dad_${1}_firefox.zip" ./src/firefox/*

echo "process finished"
read -n 1