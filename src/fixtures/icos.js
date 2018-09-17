// @flow

const todayMockDate = new Date();
const yesterdayMockDate = new Date().setDate(todayMockDate.getDate() + -1);
const tomorrowMockDate = new Date().setDate(todayMockDate.getDate() + 1);
const nextWeekMockDate = new Date().setDate(todayMockDate.getDate() + 7);

export const icos = [{
  id: '1', // This will be a UUID
  name: '2030.io',
  symbol: 'P01', // Assumed data
  address: '0xPROJECT001', // Assumed data
  decimals: 18, // Assumed data
  description: 'Tokenizing equity and other securities for client firms.' +
    'We have been accepted into the FCA sandbox and will conduct one of the UK’s' +
    'first equity-token offerings. Tokenizing equity and other securities for client' +
    'firms. We have been accepted into the FCA sandbox and will conduct one of the UK’s' +
    'first equity-token offerings.',
  iconUrl: 'https://mediaserver.responsesource.com/press-release/81489/TwentyThirty+offical+logo.png',
  socialMedia: [
    {
      service: 'twitter',
      username: 'example',
    },
  ],
  website: 'http://www.example.com',
  whitepaper: 'http://www.example.com/whitepaper.pdf',
  icos: [
    {
      nivauraProjectId: 1,
      baseCurrency: 'GBP',
      totalSupply: 100000000,
      totalLocked: 9440000,
      icoAddress: null,
      icoStartingBlockNumber: null,
      nationalityRestriction: false,
      plannedOpeningDate: new Date(yesterdayMockDate).toISOString(),
      plannedClosingDate: new Date(nextWeekMockDate).toISOString(),
      links: [],
      minimumContribution: 10,
      maximumContribution: 200,
      icoStatus: 'Pending',
      icoPhase: 'PreSale',
      unitPrice: 0.025,
      supportedCurrencies: 'GBP,ETH,BTC',
    },
  ],
}, {
  id: '2', // This will be a UUID
  name: 'PROJECT002',
  symbol: 'P02', // Assumed data
  address: '0xPROJECT002', // Assumed data
  decimals: 18, // Assumed data
  description: 'Tokenizing equity and other securities for client firms.' +
    'We have been accepted into the FCA sandbox and will conduct one of the UK’s' +
    'first equity-token offerings. Tokenizing equity and other securities for client' +
    'firms. We have been accepted into the FCA sandbox and will conduct one of the UK’s' +
    'first equity-token offerings.',
  iconUrl: 'https://mediaserver.responsesource.com/press-release/81489/TwentyThirty+offical+logo.png',
  socialMedia: [
    {
      service: 'twitter',
      username: 'example',
    },
  ],
  website: 'http://www.example.com',
  whitepaper: 'http://www.example.com/whitepaper.pdf',
  icos: [
    {
      nivauraProjectId: 2,
      baseCurrency: 'EUR',
      totalSupply: 4000000,
      totalLocked: 2000000,
      icoAddress: null,
      icoStartingBlockNumber: null,
      nationalityRestriction: false,
      plannedOpeningDate: new Date(tomorrowMockDate).toISOString(),
      plannedClosingDate: new Date(nextWeekMockDate).toISOString(),
      links: [],
      minimumContribution: 10,
      maximumContribution: 200,
      icoStatus: 'Pending',
      icoPhase: 'PreSale',
      unitPrice: 0.85,
      supportedCurrencies: 'GBP,ETH,BTC',
    },
  ],
}, {
  id: '3',
  name: 'Takken',
  symbol: 'de2', // Assumed data
  address: '0xdefault2', // Assumed data
  decimals: 18, // Assumed data
  description: 'Tokenizing equity and other securities for client firms.' +
    'We have been accepted into the FCA sandbox and will conduct one of the UK’s' +
    'first equity-token offerings. Tokenizing equity and other securities for client' +
    'firms. We have been accepted into the FCA sandbox and will conduct one of the UK’s' +
    'first equity-token offerings.',
  iconUrl: 'https://mediaserver.responsesource.com/press-release/81489/TwentyThirty+offical+logo.png',
  socialMedia: [
    {
      service: 'twitter',
      username: 'example',
    },
  ],
  website: 'http://www.example.com',
  whitepaper: 'http://www.example.com/whitepaper.pdf',
  icos: [
    {
      nivauraProjectId: 3,
      baseCurrency: 'ETH',
      totalSupply: 400000,
      totalLocked: 8000,
      icoAddress: null,
      icoStartingBlockNumber: null,
      nationalityRestriction: false,
      plannedOpeningDate: new Date(tomorrowMockDate).toISOString(),
      plannedClosingDate: new Date(nextWeekMockDate).toISOString(),
      links: [],
      minimumContribution: 10,
      maximumContribution: 200,
      icoStatus: 'Pending',
      icoPhase: 'PreSale',
      unitPrice: 0.00024,
      supportedCurrencies: 'GBP,ETH,BTC',
    },
  ],
}];

export const icoFundingInstructions = {
  account: 12345678,
  iban: 'DHFA6DA4FD5SA4F6DS4FDS',
  bic: 12345678,
  reference: 'abcdef',
  beneficiary: 'Alice Smith',
  bankName: 'XYZ Bank',
  currency: 'GBP',
  paymentType: 'bank_transfer', // | crypto_currency
  address: '3QJmV3qfvL9SuYo34YihAf3sRCW3qSinmm',
};

