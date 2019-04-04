#!/bin/bash

cd $TRAVIS_BUILD_DIR
sudo gem install bundler
cd ios && bundle check || bundle install --path vendor/bundle
cd ios && sudo bundle update
