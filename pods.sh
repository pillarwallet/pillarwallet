#!/bin/bash

cd $TRAVIS_BUILD_DIR
pod --version
brew uninstall cocoapods
sudo gem install cocoapods -v 1.5.3
cd ios && pod install --verbose
