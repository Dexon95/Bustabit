#!/bin/sh
set -e -o verbose #-e: stop on first error
#rm -rf node_modules
#npm install
gulp build
git add build --force
git add config/build-config.json --force
git commit -a -m "Compiled Version"
#git merge origin/prod -s recursive -X ours -m "Merge master into compiled"
git push origin HEAD:prod --force
git reset --hard origin/master