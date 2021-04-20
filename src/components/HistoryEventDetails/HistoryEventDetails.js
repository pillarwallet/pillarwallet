// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

import * as React from 'react';

// Types
import type { Event } from 'models/History';

// Local
import TokenTransactionEventDetails from './layouts/TokenTransactionEventDetails';
import WalletEventDetails from './layouts/WalletEventDetails';
import EnsNameEventDetails from './layouts/EnsNameEventDetails';
import BadgeReceivedEventDetails from './layouts/BadgeReceivedEventDetails';

type Props = {|
  event: Event,
|};

function HistoryEventDetails({ event }: Props) {
  switch (event.type) {
    case 'tokenReceived':
    case 'tokenSent':
      return <TokenTransactionEventDetails event={event} />;
    // case 'collectibleReceived':
    // case 'collectibleSent':
    //   return <CollectibleTransactionItem event={event} />;
    // case 'paymentChannelReceived':
    // case 'paymentChannelSent':
    // case 'paymentChannelTopUp':
    // case 'paymentChannelWithdrawal':
    // case 'paymentChannelSettlement':
    //   return <PaymentChannelTransactionItem event={event} />;
    // case 'tokenExchange':
    //   return <TokenExchangeItem event={event} />;
    // case 'exchangeFromFiat':
    //   return <ExchangeFromFiatItem event={event} />;
    case 'walletCreated':
    case 'walletActivated':
      return <WalletEventDetails event={event} />;
    case 'ensName':
      return <EnsNameEventDetails event={event} />;
    case 'badgeReceived':
      return <BadgeReceivedEventDetails event={event} />;
    default:
      return null;
  }
}

export default HistoryEventDetails;
