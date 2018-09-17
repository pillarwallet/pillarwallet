// @flow

type SocialMedia = {
  service: string,
  username: string,
}

type Link = {
  name: string,
  url: string,
}

type Offer = {
  nivauraProjectId: number,
  baseCurrency: string,
  totalSupply: number,
  totalLocked: number,
  icoAddress: string,
  icoStartingBlockNumber: number,
  nationalityRestriction: boolean,
  plannedOpeningDate: string,
  plannedClosingDate: string,
  links: Link[],
  minimumContribution: number,
  maximumContribution: number,
  icoStatus: string,
  icoPhase: string,
  unitPrice: number,
  supportedCurrencies: string,
}

export type ICO = {
  id: string,
  name: string,
  symbol: string,
  address: string,
  decimals: number,
  description: string,
  iconUrl: string,
  socialMedia: SocialMedia[],
  website: string,
  whitepaper: string,
  icos: Offer[],
}

export type ICOFundingInstructions = {
  account: number,
  iban: string,
  bic: number,
  reference: string,
  beneficiary: string,
  bankName: string,
  currency: string,
  paymentType: string,
  address: string
}
