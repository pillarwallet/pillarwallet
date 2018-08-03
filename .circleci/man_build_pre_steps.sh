#!/bin/bash
set -euo pipefail

buildNumber=$1
workingDir=$2
fastlaneTarget=$3

echo "setting build number (because fastlane needs to label our build..)"
export CIRCLE_BUILD_NUM=$buildNumber
echo "CIRCLE_BUILD_NUM=$CIRCLE_BUILD_NUM"

echo "ensuring javascript is up to date..."
echo "clearing node_modules"

cd $workingDir
rm -rf ./node_modules
echo "re-installing node_modules"
yarn install
echo "node modules sorted"

cd $workingDir/ios

echo "ensuring versions are up to date..."

echo "deleting old Pods"
rm -rf Pods
echo "Installing Pods as per Podfile.lock"
pod install
echo "pods tidied"

echo "kicking off fastlane..."
fastlane $fastlaneTarget
echo "fastlane complete"

# Below is e.g. of script being run locally for manual build
# .circleci/pre_build_steps.sh 2174 . build_ipa
