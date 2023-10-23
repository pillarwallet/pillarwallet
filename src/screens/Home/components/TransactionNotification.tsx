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
import React from 'react';
import { useDispatch } from 'react-redux';

// Constants
import { TRANSACTION_TYPE } from 'constants/transactionsConstants';
import { REMOVE_TRANSACTION_NOTIFICATION_DATA } from 'constants/exchangeConstants';

// Selectors
import { useTransactionNotification } from 'selectors';

// Local
import SendTokenNotification from './SendTokenNotification';
import ExchangeNotification from './ExchangeNotification';

export default function () {
  const dispatch = useDispatch();
  const response = useTransactionNotification();

  if (!response?.[0]) return null;

  const onCloseNofitcation = (data: any) => {
    if (data.type === TRANSACTION_TYPE.EXCHANGE) {
      const filteredNotification = response.filter((res) => res.offer !== data.offer);
      dispatch({ type: REMOVE_TRANSACTION_NOTIFICATION_DATA, payload: filteredNotification });
      return;
    }

    const filteredNotification = response.filter((res) => res.to !== data.to && res.amount !== data.amount);
    dispatch({ type: REMOVE_TRANSACTION_NOTIFICATION_DATA, payload: filteredNotification });
  };

  return response.map((notificationData, index) =>
    notificationData.type === TRANSACTION_TYPE.EXCHANGE ? (
      <ExchangeNotification data={notificationData} index={index} onCloseNofitcation={onCloseNofitcation} />
    ) : (
      <SendTokenNotification data={notificationData} index={index} onCloseNofitcation={onCloseNofitcation} />
    ),
  );
}
