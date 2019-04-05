#!/bin/bash

cd $TRAVIS_BUILD_DIR
pod --version
yes | gem uninstall cocoapods
gem install cocoapods -v 1.5.3
brew install yarn
yarn install
cd ios && pod install --verbose
