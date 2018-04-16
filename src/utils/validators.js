// @flow
export function validatePin(pin: string): string {
  if (pin.length !== 6) {
    return 'Invalid pin\'s length (should be 6 numbers)';
  } else if (!pin.match(/^\d+$/)) {
    return 'Pin could contain numbers only';
  }
  return '';
}

export default {
  validatePin,
};
