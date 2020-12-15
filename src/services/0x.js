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

import axios from 'axios';
import { BigNumber as EthersBigNumber } from 'ethers';
import { reportErrorLog } from 'utils/common';

// based on https://github.com/Rari-Capital/rari-dApp/blob/6d07a47206f409ee6c52690f43c172c25a26071b/src/rari-sdk/0x.js
export const get0xSwapOrders = async (
  inputTokenAddress: string,
  outputTokenAddress: string,
  maxInputAmountBN: EthersBigNumber,
  maxMakerAssetFillAmountBN?: EthersBigNumber,
) => {
  // eslint-disable-next-line i18next/no-literal-string
  let url = `https://api.0x.org/swap/v0/quote?sellToken=${inputTokenAddress}&buyToken=${outputTokenAddress}`;
  if (maxMakerAssetFillAmountBN !== null && maxMakerAssetFillAmountBN !== undefined) {
    url += `&buyAmount=${maxMakerAssetFillAmountBN.toString()}`;
  } else {
    url += `&sellAmount=${maxInputAmountBN.toString()}`;
  }

  const { data: decoded } = await axios.get(url)
    .catch((error) => {
      reportErrorLog('Error requesting quote from 0x swap API', { error });
      return null;
    });

  if (!decoded) {
    reportErrorLog('Failed to decode quote from 0x swap API');
    return null;
  }
  if (!decoded.orders) {
    reportErrorLog('No orders found on 0x swap API');
    return null;
  }

  decoded.orders.sort((a, b) =>
    a.makerAssetAmount / (a.takerAssetAmount + a.takerFee) <
      b.makerAssetAmount / (b.takerAssetAmount + b.takerFee)
      ? 1
      : -1,
  );

  const orders = [];
  let inputFilledAmountBN = EthersBigNumber.from(0);
  let takerAssetFilledAmountBN = EthersBigNumber.from(0);
  let makerAssetFilledAmountBN = EthersBigNumber.from(0);

  for (let i = 0; i < decoded.orders.length; i++) {
    if (
      decoded.orders[i].takerFee > 0 &&
      decoded.orders[i].takerFeeAssetData.toLowerCase() !==
        `0xf47261b0000000000000000000000000${inputTokenAddress.toLowerCase()}`
    ) {
      continue; // eslint-disable-line
    }
    const takerAssetAmountBN = EthersBigNumber.from(decoded.orders[i].takerAssetAmount);
    const takerFeeBN = EthersBigNumber.from(decoded.orders[i].takerFee);
    // Maximum amount we can send to this order including the taker fee
    const orderInputAmountBN = takerAssetAmountBN.add(takerFeeBN);
    const makerAssetAmountBN = EthersBigNumber.from(decoded.orders[i].makerAssetAmount);

    let orderMakerAssetFillAmountBN = EthersBigNumber.from(0);
    let orderTakerAssetFillAmountBN = EthersBigNumber.from(0);
    let orderInputFillAmountBN = EthersBigNumber.from(0);

    if (maxMakerAssetFillAmountBN !== null && maxMakerAssetFillAmountBN !== undefined) {
      // maxMakerAssetFillAmountBN is specified, so use it
      if (maxMakerAssetFillAmountBN.sub(makerAssetFilledAmountBN).lte(makerAssetAmountBN)) {
        // Calculate orderTakerAssetFillAmountBN and orderInputFillAmountBN from maxMakerAssetFillAmountBN
        orderMakerAssetFillAmountBN = maxMakerAssetFillAmountBN.sub(makerAssetFilledAmountBN);
        orderTakerAssetFillAmountBN = orderMakerAssetFillAmountBN.mul(takerAssetAmountBN).div(makerAssetAmountBN);
        orderInputFillAmountBN = orderMakerAssetFillAmountBN.mul(orderInputAmountBN).div(makerAssetAmountBN);

        let tries = 0;
        while (
          makerAssetAmountBN
            .mul(orderInputFillAmountBN)
            .div(orderInputAmountBN)
            .lt(orderMakerAssetFillAmountBN)
        ) {
          if (tries >= 1000) {
            reportErrorLog(
              'Failed to get increment order input amount to achieve desired output amount',
            );
            return null;
          }
          // Make sure we have enough input fill amount to achieve this maker asset fill amount
          orderInputFillAmountBN = orderInputFillAmountBN.add(1);
          tries++;
        }
      } else {
        // Fill whole order
        orderMakerAssetFillAmountBN = makerAssetAmountBN;
        orderTakerAssetFillAmountBN = takerAssetAmountBN;
        orderInputFillAmountBN = orderInputAmountBN;
      }

      // If this order input amount is higher than the remaining input, calculate orderTakerAssetFillAmountBN
      // and orderMakerAssetFillAmountBN from the remaining maxInputAmountBN as usual
      if (EthersBigNumber.isBigNumber(maxInputAmountBN) &&
          orderInputFillAmountBN.gt(maxInputAmountBN.sub(inputFilledAmountBN))) {
        orderInputFillAmountBN = maxInputAmountBN.sub(inputFilledAmountBN);
        orderTakerAssetFillAmountBN = orderInputFillAmountBN.mul(takerAssetAmountBN).div(orderInputAmountBN);
        orderMakerAssetFillAmountBN = orderInputFillAmountBN.mul(makerAssetAmountBN).div(orderInputAmountBN);
      }
      // maxMakerAssetFillAmountBN is not specified, so use maxInputAmountBN
    } else if (EthersBigNumber.isBigNumber(maxInputAmountBN) &&
        maxInputAmountBN.sub(inputFilledAmountBN).lte(orderInputAmountBN)) {
      // Calculate orderInputFillAmountBN and orderTakerAssetFillAmountBN from the remaining maxInputAmountBN as usual
      orderInputFillAmountBN = maxInputAmountBN.sub(inputFilledAmountBN);
      orderTakerAssetFillAmountBN = orderInputFillAmountBN.mul(takerAssetAmountBN).div(orderInputAmountBN);
      orderMakerAssetFillAmountBN = orderInputFillAmountBN.mul(makerAssetAmountBN).div(orderInputAmountBN);
    } else {
      // Fill whole order
      orderInputFillAmountBN = orderInputAmountBN;
      orderTakerAssetFillAmountBN = takerAssetAmountBN;
      orderMakerAssetFillAmountBN = makerAssetAmountBN;
    }

    // Add order to returned array
    orders.push(decoded.orders[i]);

    // Add order fill amounts to total fill amounts
    inputFilledAmountBN = inputFilledAmountBN.add(orderInputFillAmountBN);
    takerAssetFilledAmountBN = takerAssetFilledAmountBN.add(orderTakerAssetFillAmountBN);
    makerAssetFilledAmountBN = makerAssetFilledAmountBN.add(orderMakerAssetFillAmountBN);

    // Check if we have hit maxInputAmountBN or maxTakerAssetFillAmountBN
    if (
      (EthersBigNumber.isBigNumber(maxInputAmountBN) && inputFilledAmountBN.gte(maxInputAmountBN)) ||
        (EthersBigNumber.isBigNumber(maxMakerAssetFillAmountBN) &&
          makerAssetFilledAmountBN.gte(maxMakerAssetFillAmountBN))
    ) {
      break;
    }
  }

  if (takerAssetFilledAmountBN.isZero()) {
    reportErrorLog('No orders found on 0x swap API');
    return null;
  }
  return [
    orders,
    inputFilledAmountBN,
    decoded.protocolFee,
    takerAssetFilledAmountBN,
    decoded.price,
    decoded.guaranteedPrice,
    makerAssetFilledAmountBN,
  ];
};
