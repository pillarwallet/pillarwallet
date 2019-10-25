// @flow

import {
  SENDWYRE_WIDGET_URL,
  SENDWYRE_ACCOUNT_ID,
} from 'react-native-dotenv';

export const wyreWidgetUrl = (
  destAddress: string,
  destCurrency: string,
  sourceCurrency: string,
  sourceAmount: string,
): string => {
  const url =
    `${SENDWYRE_WIDGET_URL}?destCurrency=${
      destCurrency
    }&dest=ethereum:${
      destAddress
    }&sourceAmount=${
      sourceAmount
    }&sourceCurrency=${
      sourceCurrency
    }&accountId=${
      SENDWYRE_ACCOUNT_ID
    }`;

  return url;
};
