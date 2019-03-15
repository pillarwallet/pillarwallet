// @flow
import { BigNumber } from 'bignumber.js';

const ETH_UNIT = 1000000000000000000;

/**
 * @desc convert to amount value from BigNumber format
 * @param  {BigNumber}  value
 * @return {String}
 */
export const convertAmountFromBigNumber = (value: Object) =>
  BigNumber(value.toString())
    .dividedBy(ETH_UNIT)
    .toString();
