// @flow
export const FETCHED = 'FETCHED';
export const FETCHING = 'FETCHING';
export const FETCHING_INITIAL = 'FETCHING_INITIAL';
export const FETCH_INITIAL_FAILED = 'FETCH_INITIAL_FAILED';
export const FETCHED_INITIAL = 'FETCHED_INITIAL';
export const UPDATE_ASSET = 'UPDATE_ASSET';
export const UPDATE_ASSETS = 'UPDATE_ASSETS';
export const UPDATE_ASSETS_STATE = 'UPDATE_ASSETS_STATE';
export const UPDATE_ASSETS_BALANCES = 'UPDATE_ASSETS_BALANCES';
export const ADD_ASSET = 'ADD_ASSET';
export const REMOVE_ASSET = 'REMOVE_ASSET';
export const SET_INITIAL_ASSETS = 'SET_INITIAL_ASSETS';
export const ETH = 'ETH';
export const PLR = 'PLR';
export const EUR = 'EUR';
export const GBP = 'GBP';
export const USD = 'USD';

export const supportedFiatCurrencies = [GBP, EUR, USD];
export const defaultFiatCurrency = USD;
