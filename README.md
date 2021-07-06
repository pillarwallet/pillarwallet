# Pillar Wallet

## 💰 Looking for a job?
We're always on the lookout for talented and passionate developers. Check out our 
[RECRUITMENT.md](RECRUITMENT.md) file to see how you can join us!

## Pull Request Review
The following set of criteria and guideline has been set for code reviews
[Pillar Pull Request and Code Review Guidelines](CONTRIBUTING.md)

## Requirements
- Watchman `brew install watchman`
- node versions `9.11.1`, `10.x` (The app was tested to run with those versions without problems)

### android
- java v1.8
- android studio (suggested 3.2.1)

### iOS
- Homebrew
- yarn v1.10.x
- XCode 9.4 (Please refer to notes below to understand the problem with XCode 10)

_note_: XCode 10 includes CommonCrypto as part of the sdk which triggers a `Redefinition of module` because `rn-signal-protocol-messaging` declares it as dependency,
currently there's a fix being tested to work with XCode 10 and XCode 9.4, however while this note is here please use *XCode 9.4*

## Install and Run
To get started clone the repo and run

`yarn install`

This will download all the necessary packages to build the project. The project can be deployed using the simple command of `yarn start`. This will get your project running in development mode.

_note_: if you want to keep the `metro server` running on its own console just run `yarn start`

**Running on iOS:**

The project may be run from the directory using

`yarn run ios`


**Running on Android:**

Like yarn start, but also attempts to open your app in the iOS Simulator if you're on a Mac and have it installed.

`yarn run android`

_note_: after any compilation (i.e. after linking a native library) please restart the metro server

## Debugging

Debug implies checking logs and be able to stop on specific breakpoints. For the first requirement (watch logs) there're two options. If you want to stop on breakpoints then only the first option is for you.
However if what you want is just to track or set the logs, then Reactotron will be, probably, more effective.

### React Native Debugger
First, you need to install the [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
`brew update && brew cask install react-native-debugger`

Press *⌘+D* on iOS simulator, *⌘+M* on Android emulator, or shake real devices, you will see the in-app developer menu. Tap “Debug JS Remotely”. The React Native Debugger will be opened automatically. Open source files in the Sources tab, you can set breakpoints here.

### Reactotron
Install [Reactotron](https://github.com/infinitered/reactotron) for your specific platform ([here's the download page](https://github.com/infinitered/reactotron/releases))

Start your application an open Reactotron, that's it!

There's one change, instead of adding `console.log('something to log')` you should use `Reactotron.log('something to log')`

#### Android
For android you'd probably need to execute following command `adb reverse tcp:9090 tcp:9090`

#### Redux State
In order to view the state go to the `state` window, here you need to add the view (subscription) first.
Press `Cmd+n`, no need to enter anything specific, just click on `Subscribe`.

**Network Requests**

If you head to the `Network` and find your XHR requests are not being logged, you will notice that you are unable to see any.
You must first enable them by right clicking in the `React Devtools` or `Redux Devtools` section and clicking `Enable Network Inspect`.

**Useful Links on Debugging:**
* [A Better Way To Debug React Native Redux Apps](https://www.codementor.io/ilovett/a-better-way-to-debug-react-native-redux-apps-gwbmkbq4v)
* [React Native Debugging tools](https://codeburst.io/react-native-debugging-tools-3a24e4e40e4)
* [react-devtools](https://github.com/facebook/react-devtools/tree/master/packages/react-devtools)


## App configuration

Add your app configuration in the **/src/configs/envConfig.js** file.

```
const envVars = {
    production: {
        NETWORK_PROVIDER: 'lorem',
    }
    staging: {
        NETWORK_PROVIDER: 'ipsum',
    }
}

```

Add your local api keys and preferences in the **/src/configs/buildConfig.js** file.

Please do not commit changes of .env and buildConfig.js and be careful not to publish your local keys.

To avoid that use the following command after editing the files:
```
git update-index --assume-unchanged src/configs/buildConfig.js

git update-index --assume-unchanged .env
```

Now you can import it in your **.js** file.

```js
import { getEnv } from 'configs/envConfig'

ApiClient.init(getEnv().NETWORK_PROVIDER, ANOTHER_CONFIG)
```

**How does it work ?**

The getEnv function loads the current environment variables defined in the  **/src/configs/envConfig.js** file.

The example above will get evaluated as below when in 'staging' mode

```js
ApiClient.init('ipsum', 'foobar')
```

**In Production**

When in production mode, 
the default environment is production. When in developer mode, the default environment is staging.

The app supports switching between environments by tapping the Welcome Screen logo a certain amount of times with 
a warning that will delete all stored items on the app before the switch.

## Storybook

### To start the storybook run:
```
yarn storybook
```

This should start a storybook server and open a new tab in your browser.
To enter storybook on your device go to Settings -> Storybook.
You can also set the env variable `SHOW_ONLY_STORYBOOK` - so you don't need to enter the settings every time you reload the app. In the browser or on your device you can now switch between components.

## Old CRNA Readme

This project was bootstrapped with [Create React Native App](https://github.com/react-community/create-react-native-app).

Below you'll find information about performing common tasks. The most recent version of this guide is available [here](https://github.com/react-community/create-react-native-app/blob/master/react-native-scripts/template/README.md).

## Table of Contents

* [Updating to New Releases](#updating-to-new-releases)
* [Available Scripts](#available-scripts)
  * [npm start](#npm-start)
  * [npm test](#npm-test)
  * [npm run ios](#npm-run-ios)
  * [npm run android](#npm-run-android)
  * [npm run eject](#npm-run-eject)
* [Writing and Running Tests](#writing-and-running-tests)
* [Environment Variables](#environment-variables)
  * [Configuring Packager IP Address](#configuring-packager-ip-address)
* [Adding Flow](#adding-flow)
* [Customizing App Display Name and Icon](#customizing-app-display-name-and-icon)
* [Sharing and Deployment](#sharing-and-deployment)
  * [Publishing to Expo's React Native Community](#publishing-to-expos-react-native-community)
  * [Building an Expo "standalone" app](#building-an-expo-standalone-app)
  * [Ejecting from Create React Native App](#ejecting-from-create-react-native-app)
    * [Build Dependencies (Xcode & Android Studio)](#build-dependencies-xcode-android-studio)
    * [Should I Use ExpoKit?](#should-i-use-expokit)
* [Troubleshooting](#troubleshooting)
  * [Networking](#networking)
  * [iOS Simulator won't open](#ios-simulator-wont-open)
  * [QR Code does not scan](#qr-code-does-not-scan)

## Updating to New Releases

You should only need to update the global installation of `create-react-native-app` very rarely, ideally never.

Updating the `react-native-scripts` dependency of your app should be as simple as bumping the version number in `package.json` and reinstalling your project's dependencies.

Upgrading to a new version of React Native requires updating the `react-native`, `react`, and `expo` package versions, and setting the correct `sdkVersion` in `app.json`. See the [versioning guide](https://github.com/react-community/create-react-native-app/blob/master/VERSIONS.md) for up-to-date information about package version compatibility.

## Available Scripts

If Yarn was installed when the project was initialized, then dependencies will have been installed via Yarn, and you should probably use it to run these commands as well. Unlike dependency installation, command running syntax is identical for Yarn and NPM at the time of this writing.

### `npm start`

Runs your app in development mode.

Open it in the [Expo app](https://expo.io) on your phone to view it. It will reload if you save edits to your files, and you will see build errors and logs in the terminal.

#### `npm test`

Runs the [jest](https://github.com/facebook/jest) test runner on your tests.

#### `npm run ios`

Like `npm start`, but also attempts to open your app in the iOS Simulator if you're on a Mac and have it installed.

#### `npm run android`

Like `npm start`, but also attempts to open your app on a connected Android device or emulator. Requires an installation of Android build tools (see [React Native docs](https://facebook.github.io/react-native/docs/getting-started.html) for detailed setup). We also recommend installing Genymotion as your Android emulator. Once you've finished setting up the native build environment, there are two options for making the right copy of `adb` available to Create React Native App:

##### Using Android Studio's `adb`

1. Make sure that you can run adb from your terminal.
2. Open Genymotion and navigate to `Settings -> ADB`. Select “Use custom Android SDK tools” and update with your [Android SDK directory](https://stackoverflow.com/questions/25176594/android-sdk-location).

##### Using Genymotion's `adb`

1. Find Genymotion’s copy of adb. On macOS for example, this is normally `/Applications/Genymotion.app/Contents/MacOS/tools/`.
2. Add the Genymotion tools directory to your path (instructions for [Mac](http://osxdaily.com/2014/08/14/add-new-path-to-path-command-line/), [Linux](http://www.computerhope.com/issues/ch001647.htm), and [Windows](https://www.howtogeek.com/118594/how-to-edit-your-system-path-for-easy-command-line-access/)).
3. Make sure that you can run adb from your terminal.

#### `npm run eject`

This will start the process of "ejecting" from Create React Native App's build scripts. You'll be asked a couple of questions about how you'd like to build your project.

**Warning:** Running eject is a permanent action (aside from whatever version control system you use). An ejected app will require you to have an [Xcode and/or Android Studio environment](https://facebook.github.io/react-native/docs/getting-started.html) set up.

## Customizing App Display Name and Icon

You can edit `app.json` to include [configuration keys](https://docs.expo.io/versions/latest/guides/configuration.html) under the `expo` key.

To change your app's display name, set the `expo.name` key in `app.json` to an appropriate string.

To set an app icon, set the `expo.icon` key in `app.json` to be either a local path or a URL. It's recommended that you use a 512x512 png file with transparency.

## Writing and Running Tests

This project is set up to use [jest](https://facebook.github.io/jest/) for tests. You can configure whatever testing strategy you like, but jest works out of the box. Create test files in directories called `__tests__` or with the `.test` extension to have the files loaded by jest. See the [the template project](https://github.com/react-community/create-react-native-app/blob/master/react-native-scripts/template/App.test.js) for an example test. The [jest documentation](https://facebook.github.io/jest/docs/en/getting-started.html) is also a wonderful resource, as is the [React Native testing tutorial](https://facebook.github.io/jest/docs/en/tutorial-react-native.html).

## Environment Variables

You can configure some of Create React Native App's behavior using environment variables.

### Configuring Packager IP Address

When starting your project, you'll see something like this for your project URL:

```
exp://192.168.0.2:19000
```

The "manifest" at that URL tells the Expo app how to retrieve and load your app's JavaScript bundle, so even if you load it in the app via a URL like `exp://localhost:19000`, the Expo client app will still try to retrieve your app at the IP address that the start script provides.

In some cases, this is less than ideal. This might be the case if you need to run your project inside of a virtual machine and you have to access the packager via a different IP address than the one which prints by default. In order to override the IP address or hostname that is detected by Create React Native App, you can specify your own hostname via the `REACT_NATIVE_PACKAGER_HOSTNAME` environment variable:

Mac and Linux:

```
REACT_NATIVE_PACKAGER_HOSTNAME='my-custom-ip-address-or-hostname' npm start
```

Windows:
```
set REACT_NATIVE_PACKAGER_HOSTNAME='my-custom-ip-address-or-hostname'
npm start
```

The above example would cause the development server to listen on `exp://my-custom-ip-address-or-hostname:19000`.

## Adding Flow

Flow is a static type checker that helps you write code with fewer bugs. Check out this [introduction to using static types in JavaScript](https://medium.com/@preethikasireddy/why-use-static-types-in-javascript-part-1-8382da1e0adb) if you are new to this concept.

React Native works with [Flow](http://flowtype.org/) out of the box, as long as your Flow version matches the one used in the version of React Native.

To add a local dependency to the correct Flow version to a Create React Native App project, follow these steps:

1. Find the Flow `[version]` at the bottom of the included [.flowconfig](.flowconfig)
2. Run `npm install --save-dev flow-bin@x.y.z` (or `yarn add --dev flow-bin@x.y.z`), where `x.y.z` is the .flowconfig version number.
3. Add `"flow": "flow"` to the `scripts` section of your `package.json`.
4. Add `// @flow` to any files you want to type check (for example, to `App.js`).

Now you can run `npm run flow` (or `yarn flow`) to check the files for type errors.
You can optionally use a [plugin for your IDE or editor](https://flow.org/en/docs/editors/) for a better integrated experience.

To learn more about Flow, check out [its documentation](https://flow.org/).

## Sharing and Deployment

Create React Native App does a lot of work to make app setup and development simple and straightforward, but it's very difficult to do the same for deploying to Apple's App Store or Google's Play Store without relying on a hosted service.

### Publishing to Expo's React Native Community

Expo provides free hosting for the JS-only apps created by CRNA, allowing you to share your app through the Expo client app. This requires registration for an Expo account.

Install the `exp` command-line tool, and run the publish command:

```
$ npm i -g exp
$ exp publish
```

### Building an Expo "standalone" app

You can also use a service like [Expo's standalone builds](https://docs.expo.io/versions/latest/guides/building-standalone-apps.html) if you want to get an IPA/APK for distribution without having to build the native code yourself.

### Ejecting from Create React Native App

If you want to build and deploy your app yourself, you'll need to eject from CRNA and use Xcode and Android Studio.

This is usually as simple as running `npm run eject` in your project, which will walk you through the process. Make sure to install `react-native-cli` and follow the [native code getting started guide for React Native](https://facebook.github.io/react-native/docs/getting-started.html).

#### Should I Use ExpoKit?

If you have made use of Expo APIs while working on your project, then those API calls will stop working if you eject to a regular React Native project. If you want to continue using those APIs, you can eject to "React Native + ExpoKit" which will still allow you to build your own native code and continue using the Expo APIs. See the [ejecting guide](https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md) for more details about this option.

## Troubleshooting

### Networking

If you're unable to load your app on your phone due to a network timeout or a refused connection, a good first step is to verify that your phone and computer are on the same network and that they can reach each other. Create React Native App needs access to ports 19000 and 19001 so ensure that your network and firewall settings allow access from your device to your computer on both of these ports.

Try opening a web browser on your phone and opening the URL that the packager script prints, replacing `exp://` with `http://`. So, for example, if underneath the QR code in your terminal you see:

```
exp://192.168.0.1:19000
```

Try opening Safari or Chrome on your phone and loading

```
http://192.168.0.1:19000
```

and

```
http://192.168.0.1:19001
```

If this works, but you're still unable to load your app by scanning the QR code, please open an issue on the [Create React Native App repository](https://github.com/react-community/create-react-native-app) with details about these steps and any other error messages you may have received.

If you're not able to load the `http` URL in your phone's web browser, try using the tethering/mobile hotspot feature on your phone (beware of data usage, though), connecting your computer to that WiFi network, and restarting the packager. If you are using a VPN you may need to disable it.

### iOS Simulator won't open

If you're on a Mac, there are a few errors that users sometimes see when attempting to `npm run ios`:

* "non-zero exit code: 107"
* "You may need to install Xcode" but it is already installed
* and others

There are a few steps you may want to take to troubleshoot these kinds of errors:

1. Make sure Xcode is installed and open it to accept the license agreement if it prompts you. You can install it from the Mac App Store.
2. Open Xcode's Preferences, the Locations tab, and make sure that the `Command Line Tools` menu option is set to something. Sometimes when the CLI tools are first installed by Homebrew this option is left blank, which can prevent Apple utilities from finding the simulator. Make sure to re-run `npm/yarn run ios` after doing so.
3. If that doesn't work, open the Simulator, and under the app menu select `Reset Contents and Settings...`. After that has finished, quit the Simulator, and re-run `npm/yarn run ios`.

### QR Code does not scan

If you're not able to scan the QR code, make sure your phone's camera is focusing correctly, and also make sure that the contrast on the two colors in your terminal is high enough. For example, WebStorm's default themes may [not have enough contrast](https://github.com/react-community/create-react-native-app/issues/49) for terminal QR codes to be scannable with the system barcode scanners that the Expo app uses.

If this causes problems for you, you may want to try changing your terminal's color theme to have more contrast, or running Create React Native App from a different terminal. You can also manually enter the URL printed by the packager script in the Expo app's search bar to load it manually.
