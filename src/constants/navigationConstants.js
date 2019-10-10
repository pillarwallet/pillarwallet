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

// APP FLOW
export const APP_FLOW = 'APP_FLOW';
export const TAB_NAVIGATION = 'TAB_NAVIGATION';
export const ASSETS = 'ASSETS';
export const SERVICES = 'SERVICES';
export const EXCHANGE_TAB = 'EXCHANGE_TAB';
export const ME_TAB = 'ME_TAB';
export const PEOPLE = 'PEOPLE';
export const ASSET = 'ASSET';
export const MARKET = 'MARKET';
export const PROFILE = 'PROFILE';
export const CONTACT_INFO = 'CONTACT_INFO';
export const REVEAL_BACKUP_PHRASE = 'REVEAL_BACKUP_PHRASE';
export const CHAT_LIST = 'CHAT_LIST';
export const NEW_CHAT = 'NEW_CHAT';
export const CHAT = 'CHAT';
export const ICO = 'ICO';
export const BACKUP_WALLET_IN_SETTINGS_FLOW = 'BACKUP_WALLET_IN_SETTINGS_FLOW';
export const COLLECTIBLE = 'COLLECTIBLE';
export const BADGE = 'BADGE';
export const CONFIRM_CLAIM = 'CONFIRM_CLAIM';
export const SETTINGS = 'SETTINGS';

// ASSETS FLOW
export const ACCOUNTS = 'ACCOUNTS';
export const UNSETTLED_ASSETS = 'UNSETTLED_ASSETS';

// CHANGE PIN FLOW
export const CHANGE_PIN_FLOW = 'CHANGE_PIN_FLOW';
export const CHANGE_PIN_CURRENT_PIN = 'CHANGE_PIN_CURRENT_PIN';
export const CHANGE_PIN_NEW_PIN = 'CHANGE_PIN_NEW_PIN';
export const CHANGE_PIN_CONFIRM_NEW_PIN = 'CHANGE_PIN_CONFIRM_NEW_PIN';

// ONBOARDING FLOW
export const ONBOARDING_FLOW = 'ONBOARDING_FLOW';
export const ONBOARDING_HOME = 'ONBOARDING_HOME';
export const NEW_WALLET = 'NEW_WALLET';
export const NEW_PROFILE = 'NEW_PROFILE';
export const IMPORT_WALLET = 'IMPORT_WALLET';
export const IMPORT_WALLET_LEGALS = 'IMPORT_WALLET_LEGALS';
export const BACKUP_PHRASE = 'BACKUP_PHRASE';
export const BACKUP_PHRASE_VALIDATE = 'BACKUP_PHRASE_VALIDATE';
export const SET_WALLET_PIN_CODE = 'SET_WALLET_PIN_CODE';
export const PIN_CODE_CONFIRMATION = 'PIN_CODE_CONFIRMATION';
export const LEGAL_TERMS = 'LEGAL_TERMS';
export const PERMISSIONS = 'PERMISSIONS';

// PINCODE FLOW
export const AUTH_FLOW = 'AUTH_FLOW';
export const PIN_CODE_UNLOCK = 'PIN_CODE_UNLOCK';
export const FORGOT_PIN = 'FORGOT_PIN';

// SIGNUP/OTP FLOW
export const SECURITY_CONFIRM = 'SECURITY_CONFIRM';
export const SIGN_UP_FLOW = 'SIGN_UP_FLOW';
export const WELCOME = 'WELCOME';
export const SIGN_IN = 'SIGN_IN';
export const OTP = 'OTP';
export const OTP_STATUS = 'OTP_STATUS';
export const SIGN_UP = 'SIGN_UP';

// SEND TOKEN FLOW
export const SEND_TOKEN_FROM_ASSET_FLOW = 'SEND_TOKEN_FROM_ASSET_FLOW';
export const SEND_TOKEN_FROM_CONTACT_FLOW = 'SEND_TOKEN_FROM_CONTACT_FLOW';
export const SEND_TOKEN_AMOUNT = 'SEND_TOKEN_AMOUNT';
export const SEND_TOKEN_CONTACTS = 'SEND_TOKEN_CONTACTS';
export const SEND_TOKEN_ASSETS = 'SEND_TOKEN_ASSETS';
export const SEND_TOKEN_CONFIRM = 'SEND_TOKEN_CONFIRM';
export const SEND_TOKEN_TRANSACTION = 'SEND_TOKEN_TRANSACTION';
export const SEND_TOKEN_PIN_CONFIRM = 'SEND_TOKEN_PIN_CONFIRM'; // TODO: consider to extract to a common screen

// PPN SEND TOKEN FLOW
export const PPN_SEND_TOKEN_FROM_ASSET_FLOW = 'PPN_SEND_TOKEN_FROM_ASSET_FLOW';
export const PPN_SEND_TOKEN_AMOUNT = 'PPN_SEND_TOKEN_AMOUNT';

// SEND COLLECTIBLE FLOW
export const SEND_COLLECTIBLE_FROM_ASSET_FLOW = 'SEND_COLLECTIBLE_FROM_ASSET_FLOW';
export const SEND_COLLECTIBLE_CONFIRM = 'SEND_COLLECTIBLE_CONFIRM';

// PARTICIPATE IN ICO FLOW
export const PARTICIPATE_IN_ICO_FLOW = 'PARTICIPATE_IN_ICO_FLOW';
export const ICO_PARTICIPATE = 'ICO_PARTICIPATE';
export const ICO_INSTRUCTIONS = 'ICO_INSTRUCTIONS';
export const ICO_CONFIRM = 'ICO_CONFIRM';
export const ICO_LINKS = 'ICO_LINKS';

// PEOPLE FLOW
export const CONTACT = 'CONTACT';
export const CONNECTION_REQUESTS = 'CONNECTION_REQUESTS';

// HOME FLOW
export const HOME = 'HOME';
export const HOME_TAB = 'HOME_TAB';
export const LOGIN = 'LOGIN';
export const FIAT_EXCHANGE = 'FIAT_EXCHANGE';
export const FIAT_CRYPTO = 'FIAT_CRYPTO';

// EXCHANGE FLOW
export const EXCHANGE = 'EXCHANGE';
export const EXCHANGE_CONFIRM = 'EXCHANGE_CONFIRM';
export const EXCHANGE_INFO = 'EXCHANGE_INFO';

// UPGRADE TO SMART WALLET FLOW
export const UPGRADE_TO_SMART_WALLET_FLOW = 'UPGRADE_TO_SMART_WALLET_FLOW';
export const UPGRADE_INFO = 'UPGRADE_INFO';
export const UPGRADE_INTRO = 'UPGRADE_INTRO';
export const RECOVERY_AGENTS = 'RECOVERY_AGENTS';
export const CHOOSE_ASSETS_TO_TRANSFER = 'CHOOSE_ASSETS_TO_TRANSFER';
export const EDIT_ASSET_AMOUNT_TO_TRANSFER = 'EDIT_ASSET_AMOUNT_TO_TRANSFER';
export const UPGRADE_CONFIRM = 'UPGRADE_CONFIRM';
export const UPGRADE_REVIEW = 'UPGRADE_REVIEW';
export const SMART_WALLET_UNLOCK = 'SMART_WALLET_UNLOCK';
export const SMART_WALLET_INTRO = 'SMART_WALLET_INTRO';

// MANAGE WALLETS FLOW
export const MANAGE_WALLETS_FLOW = 'MANAGE_WALLETS_FLOW';
export const WALLET_SETTINGS = 'WALLET_SETTINGS';

// MANAGE TANK FLOW
export const TANK_SETTLE_FLOW = 'TANK_SETTLE_FLOW';
export const TANK_FUND_FLOW = 'TANK_FUND_FLOW';
export const TANK_DETAILS = 'TANK_DETAILS';
export const FUND_TANK = 'FUND_TANK';
export const FUND_CONFIRM = 'FUND_CONFIRM';
export const SETTLE_BALANCE = 'SETTLE_BALANCE';
export const SETTLE_BALANCE_CONFIRM = 'SETTLE_BALANCE_CONFIRM';
export const PILLAR_NETWORK_INTRO = 'PILLAR_NETWORK_INTRO';
export const TANK_WITHDRAWAL_FLOW = 'TANK_WITHDRAWAL_FLOW';
export const TANK_WITHDRAWAL = 'TANK_WITHDRAWAL';
export const TANK_WITHDRAWAL_CONFIRM = 'TANK_WITHDRAWAL_CONFIRM';

// WALLETCONNECT FLOW
export const SCAN_TAB = 'SCAN_TAB';
export const WALLETCONNECT_FLOW = 'WALLETCONNECT_FLOW';
export const WALLETCONNECT_SESSION_REQUEST_SCREEN = 'WALLETCONNECT_SESSION_REQUEST_SCREEN';
export const WALLETCONNECT_CALL_REQUEST_SCREEN = 'WALLETCONNECT_CALL_REQUEST_SCREEN';
export const WALLETCONNECT_PIN_CONFIRM_SCREEN = 'WALLETCONNECT_PIN_CONFIRM_SCREEN';

// ME FLOW
export const ME = 'ME';
export const MANAGE_DETAILS_SESSIONS = 'MANAGE_DETAILS_SESSIONS';

// USERS FLOW
export const MANAGE_USERS_FLOW = 'MANAGE_USERS_FLOW';
export const USERS = 'USERS';
export const USER_SETTINGS = 'USER_SETTINGS';
export const ADD_EDIT_USER = 'ADD_EDIT_USER';
