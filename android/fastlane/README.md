fastlane documentation
================
# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```
xcode-select --install
```

Install _fastlane_ using
```
[sudo] gem install fastlane -NV
```
or alternatively using `brew cask install fastlane`

# Available Actions
## Android
### android deploy_staging
```
fastlane android deploy_staging
```
Deploy a new version to the Google Play Staging Test Track
### android deploy_internal
```
fastlane android deploy_internal
```
Deploy a new version to the Google Play Internal Test Track
### android deploy_alpha
```
fastlane android deploy_alpha
```
Deploy a new alpha version to the Google Play Store Alpha Track
### android deploy_beta
```
fastlane android deploy_beta
```
Deploy a new beta version to the Google Play Store Beta Track

----

This README.md is auto-generated and will be re-generated every time [fastlane](https://fastlane.tools) is run.
More information about fastlane can be found on [fastlane.tools](https://fastlane.tools).
The documentation of fastlane can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
