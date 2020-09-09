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
import { KEYPAD_BUTTON_DELETE, KEYPAD_BUTTON_FORGOT, KEYPAD_BUTTON_DOT } from 'constants/keyPadButtonsConstants';
import t from 'translations/translate';

const backspaceIMG = require('assets/icons/backspace.png');
const backspaceDarkThemeIMG = require('assets/icons/backspace_dark_theme.png');

type KeyPadButton = {
  label: string,
  value: string,
}

const numbers = [
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: '9', value: '9' },
];

const getPincode = (props: Object): KeyPadButton[] => {
  const finalRow = [
    props.showForgotButton ? {
      label: t('auth:forgot', { capitalize: true, questionMark: true }),
      type: 'string',
      value: KEYPAD_BUTTON_FORGOT,
    } : { label: '', value: '' },
    { label: '0', value: '0' },
    {
      label: '⌫', // eslint-disable-line i18next/no-literal-string
      value: KEYPAD_BUTTON_DELETE,
      type: 'image',
      image: backspaceIMG,
      imageDarkTheme: backspaceDarkThemeIMG,
    },
  ];

  return numbers.concat(finalRow);
};

const getNumeric = (): KeyPadButton[] => {
  const finalRow = [
    { label: '.', value: KEYPAD_BUTTON_DOT },
    { label: '0', value: '0' },
    {
      label: '⌫', // eslint-disable-line i18next/no-literal-string
      value: KEYPAD_BUTTON_DELETE,
      type: 'image',
      image: backspaceIMG,
      imageDarkTheme: backspaceDarkThemeIMG,
    },
  ];
  return numbers.concat(finalRow);
};

export default {
  pincode: getPincode,
  numeric: getNumeric,
};
