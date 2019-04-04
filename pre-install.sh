#!/bin/bash

cd $TRAVIS_BUILD_DIR
export APP_BUILD_NUMBER=$TRAVIS_BUILD_NUMBER
npm version $(node -e "const currentVersion=require('./package.json').version; const firstTwoDots=currentVersion.substring(0, currentVersion.lastIndexOf('.')+1); console.log(firstTwoDots);")$APP_BUILD_NUMBER
export buildNumber=$(node -e "console.log(require('./package.json').version);")
rm .env
cp environments/.env.staging ./.env
sed -i.bak "s/_build_number_/$buildNumber/g" .env
sed -i.bak "s/_open_sea_api_key_/$OPEN_SEA_API_KEY/g" .env
sed -i.bak "s/_infura_project_id_/$INFURA_PROJECT_ID/g" .env
echo "$buildNumber" >> ~/pillarwallet/buildNumber.txt
