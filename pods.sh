#!/bin/bash

cd $TRAVIS_BUILD_DIR
pod --version
sudo gem uninstall cocoapods -v 1.6.1
sudo gem install cocoapods -v 1.5.3
cd ios && pod install --verbose
