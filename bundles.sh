#!/bin/bash

sudo gem install bundler
cd ios && bundle check || bundle install --path vendor/bundle
cd ios && sudo bundle update
