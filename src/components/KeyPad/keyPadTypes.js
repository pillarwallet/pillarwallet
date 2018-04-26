// @flow
import { KEYPAD_BUTTON_DELETE, KEYPAD_BUTTON_FORGOT, KEYPAD_BUTTON_DOT } from 'constants/keyPadButtonsConstants';

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

export const getPincode = (props: Object): KeyPadButton[] => {
  const finalRow = [
    props.showForgotButton ? { label: 'Forgot?', value: KEYPAD_BUTTON_FORGOT } : { label: '', value: '' },
    { label: '0', value: '0' },
    { label: '⌫', value: KEYPAD_BUTTON_DELETE },
  ];

  return numbers.concat(finalRow);
};

export const getNumeric = (): KeyPadButton[] => {
  const finalRow = [
    { label: '.', value: KEYPAD_BUTTON_DOT },
    { label: '0', value: '0' },
    { label: '⌫', value: KEYPAD_BUTTON_DELETE },
  ];
  return numbers.concat(finalRow);
};

export default {
  pincode: getPincode,
  numeric: getNumeric,
};
