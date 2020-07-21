// @flow

const getLocales = () => [
  {
    countryCode: 'US',
    languageTag: 'en-US',
    languageCode: 'en',
    isRTL: false,
  },
  {
    countryCode: 'FR',
    languageTag: 'fr-FR',
    languageCode: 'fr',
    isRTL: false,
  },
];

const findBestAvailableLanguage = () => ({
  languageTag: 'en-GB',
  isRTL: false,
});

const getNumberFormatSettings = () => ({
  decimalSeparator: '.',
  groupingSeparator: ',',
});

const getCalendar = () => 'gregorian';
const getCountry = () => 'GB';
const getCurrencies = () => ['GBP', 'EUR'];
const getTemperatureUnit = () => 'celsius';
const getTimeZone = () => 'Europe/London';
const uses24HourClock = () => true;
const usesMetricSystem = () => true;

export {
  findBestAvailableLanguage,
  getLocales,
  getNumberFormatSettings,
  getCalendar,
  getCountry,
  getCurrencies,
  getTemperatureUnit,
  getTimeZone,
  uses24HourClock,
  usesMetricSystem,
};
