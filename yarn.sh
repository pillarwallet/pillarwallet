#!/bin/bash

cd $TRAVIS_BUILD_DIR
brew install node
node -v
npm -v
brew install yarn
yarn install
