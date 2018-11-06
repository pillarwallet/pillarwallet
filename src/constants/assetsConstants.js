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
export const START_ASSETS_SEARCH = 'START_ASSETS_SEARCH';
export const UPDATE_ASSETS_SEARCH_RESULT = 'UPDATE_ASSETS_SEARCH_RESULT';
export const RESET_ASSETS_SEARCH_RESULT = 'RESET_ASSETS_SEARCH_RESULT';
export const ADD_ASSET = 'ADD_ASSET';
export const REMOVE_ASSET = 'REMOVE_ASSET';
export const SET_INITIAL_ASSETS = 'SET_INITIAL_ASSETS';
export const UPDATE_SUPPORTED_ASSETS = 'UPDATE_SUPPORTED_ASSETS';
export const UPDATE_BALANCES = 'UPDATE_BALANCES';
export const ETH = 'ETH';
export const PLR = 'PLR';
export const EUR = 'EUR';
export const GBP = 'GBP';
export const USD = 'USD';

export const supportedFiatCurrencies = [GBP, EUR, USD];
export const defaultFiatCurrency = GBP;
