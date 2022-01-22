if [ $# -eq 0 ]; then
    echo "no version provided"
    read -n 1
    exit 1
fi

git add .
git commit -m "release ${1}"
git push