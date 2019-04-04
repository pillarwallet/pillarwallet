#!/bin/bash

export buildNumber=$(cat ~/pillarwallet/buildNumber.txt)
export APP_BUILD_NUMBER="$(cat /tmp/workspace/build-num/app_build_number.txt)"
cd ios && bundle exec fastlane deploy_staging APP_BUILD_NUMBER:$APP_BUILD_NUMBER build_number:$buildNumber APP_NAME:"Pillar Staging"
