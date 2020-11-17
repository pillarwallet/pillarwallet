# Localisation

## Translations

### Translations setup
Translations feature is managed by setting `isEnabled` to `true` in `configs/localeConfigs` **OR** providing `baseUrl`
to fetch external translations.
_(to disable it in development, adjust `DISABLE_EXTERNAL_TRANSLATIONS_ON_DEV` value in `buildConfig`)_
If the first requirement is not met, locally stored default language's (set in `configs/localeConfigs` as `defaultLanguage`) translations are being used.
If the second one is not provided - locally stored translations are used.

### Translation initialisation flow
Translations feature is intended to be initialised in this way:
1. Check if translation feature is supported. (see [Translations setup](#translations-setup)).
2. Preferred language is checked (see [Preferred and Default languages](#preferred-and-default-languages)).
3. Resources (external, cached or local, see [Translation resource types](#translation-resource-types)) are fetched / loaded.
4. Fallback language resources (if needed, see [Translation fallbacks](#translation-fallbacks)) are fetched / loaded.
5. Resources are set as `i18next`'s bundles. (see [Library methods](#library-methods))
6. `areTranslationsInitialised` in session reducer is set to `true` to allow app view rendering in `App.js`.
7. `sessionLanguageCode` is set to force rerender of components that utilise `shouldComponentUpdate`. 


### Preferred and Default languages
If user is not selected otherwise, language for translation resources are being selected based on user's device preferences
and app's supported languages - if user device language is found in `localeConfig.supportedLanguages` array, it is being returned as default supported user language.
If not - `localeConfig.defaultLanguage` is being used.

If user selects language, it is being set to `appSettings` reducer as `activeLngCode` (in `localisation` object).

If previously selected user's language is no longer supported, `defaultLanguage` set in `configs/localeConfigs` is used.

### Translation resource types
There are two types of resources: 
- **external** (that can also be cached) - translation resources that are being fetched from provided url
as a json file and are stored (cached) into folder on user's device.
The newest versions of resources are fetched (if connection is available) on app open and on language change action.
If connection is not available, cached version is being used instead.
- **local** - translations _(do not confuse those with cached external translations)_ that
are being added to `locales` folder at the time of app build _(due to be added)_.
Those translations are used if connection is not available at the time of 
resources request and no cached version is available.

Each of supported language is supposed to have two resource files named after `nameSpaces`:
- `auth.json` - that stores translations used in onboarding and authorisation flows
- `common.json` - that store all the rest of translations

### Translation fallbacks
If language that is being used for translations is not equal to `localeCongfig.defaultLanguage`,
translation resources for `localeCongfig.defaultLanguage` **MUST** be set as `i18next`'s resourceBundles since
`localeCongfig.defaultLanguage` is supposed to have all required translation strings and those can be used if any is
missing in selected language's translation resources.

### Library methods
Translations are being handled using `i18next` internationalization framework.
More on it's api - [here](https://www.i18next.com/overview/api).

### Translations updates
Translation resources are updated at the beginning of new session based on connection availability.
- if connection is AVAILABLE: newest version gets fetched from the server and are stored on user's device.
Then it gets loaded from a device's folder and is passed to `i18next` as a `resourceBundle`. 
- if connection is NOT AVAILABLE: cached (if present) or locally stored version of translations is passed to 
`i18next` as a `resourceBundle`.

### Adding new supported language
Steps to add new supported language:
1. Add a new prop to `localeConfig`'s `supportedLanguages` object
like so: key - new language's code, value - new language's name in that language. (This value is shown in language selector).
2. Create two constants holding urls to where locally stored translations will be added on app's build (for more information see **local** part of [Translation resource types](#translation-resource-types)) like so:
    ```
    const [language-code]_COMMON = require('../locales/[language-code]/common.json');
    const [language-code]_AUTH = require('../locales/[language-code]/auth.json');
    ```
3. Add those constants to `localeConfig`'s `localTranslations` object like so:
key - new language's code, value - object containing two keys with values of paths: 
    ```
    {
      common: [language-code]_COMMON,
      auth: [language-code]_AUTH
    }
    ```
