#!/bin/bash

cd $TRAVIS_BUILD_DIR
export APP_BUILD_NUMBER=7785
export NODE_OPTIONS=--max_old_space_size=2048; api-console build -n "5.0.0-preview-1" -t "RAML 1.0" -a api.raml --verbose
npm version $(node -e "const currentVersion=require('./package.json').version; const firstTwoDots=currentVersion.substring(0, currentVersion.lastIndexOf('.')+1); console.log(firstTwoDots);")$APP_BUILD_NUMBER
export buildNumber=$(node -e "console.log(require('./package.json').version);")
rm .env
cp environments/.env.staging ./.env
sed -i.bak "s/_build_number_/$buildNumber/g" .env
sed -i.bak "s/_open_sea_api_key_/$OPEN_SEA_API_KEY/g" .env
sed -i.bak "s/_infura_project_id_/$INFURA_PROJECT_ID/g" .env
echo "$buildNumber" >> $TRAVIS_BUILD_DIR/buildNumber.txt
cd $TRAVIS_BUILD_DIR
brew install yarn
yarn install
yes | gem uninstall cocoapods
gem install cocoapods -v 1.5.3
cd $TRAVIS_BUILD_DIR/ios && pod install --verbose
gem install bundler
cd $TRAVIS_BUILD_DIR/ios && bundle check || bundle install --path vendor/bundle
cd $TRAVIS_BUILD_DIR/ios && bundle update
export buildNumber=$(cat $TRAVIS_BUILD_DIR/buildNumber.txt)
export APP_BUILD_NUMBER=7785
echo $FASTLANE_PASSWORD
echo $OAUTH_TOKEN
yarn build:ios
cd $TRAVIS_BUILD_DIR/ios && bundle exec fastlane deploy_staging APP_BUILD_NUMBER:$APP_BUILD_NUMBER build_number:$buildNumber APP_NAME:"Pillar Staging"
