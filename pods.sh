#!/bin/bash

cd $TRAVIS_BUILD_DIR
pod --version
yes | gem uninstall cocoapods
gem install cocoapods -v 1.5.3
cd ios && pod install --verbose
