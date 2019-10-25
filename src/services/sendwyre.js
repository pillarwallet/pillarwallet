// @flow

import {
  SENDWYRE_WIDGET_URL,
  SENDWYRE_ENVIRONMENT,
  SENDWYRE_ACCOUNT_ID,
  SENDWYRE_RETURN_URL,
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
    }&env=${
      SENDWYRE_ENVIRONMENT
    }&dest=ethereum:${
      destAddress
    }&sourceAmount=${
      sourceAmount
    }&sourceCurrency=${
      sourceCurrency
    }&accountId=${
      SENDWYRE_ACCOUNT_ID
    }&redirectUrl=${
      encodeURIComponent(SENDWYRE_RETURN_URL)
    }`;

  return url;
};
