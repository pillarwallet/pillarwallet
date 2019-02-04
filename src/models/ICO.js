// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

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
