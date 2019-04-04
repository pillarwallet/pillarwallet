#!/bin/bash

Y | sudo gem uninstall cocoapods
sudo gem install cocoapods -v 1.5.3
cd ios && pod install --verbose
