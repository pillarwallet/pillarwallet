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
import { type Event, EVENT_TYPE } from 'models/History';
import type { Chain } from 'models/Chain';

// Local
import TokenTransactionEventDetails from './layouts/TokenTransactionEventDetails';
import CollectibleTransactionEventDetails from './layouts/CollectibleTransactionEventDetails';
import TokenExchangeEventDetails from './layouts/TokenExchangeEventDetails';
import ExchangeFromFiatEventDetails from './layouts/ExchangeFromFiatEventDetails';
import WalletEventDetails from './layouts/WalletEventDetails';
import EnsNameEventDetails from './layouts/EnsNameEventDetails';


type Props = {|
  event: Event,
  chain: Chain,
|};

function HistoryEventDetails({ event, chain }: Props) {
  switch (event.type) {
    case EVENT_TYPE.TOKEN_RECEIVED:
    case EVENT_TYPE.TOKEN_SENT:
      return <TokenTransactionEventDetails event={event} chain={chain} />;
    case EVENT_TYPE.COLLECTIBLE_RECEIVED:
    case EVENT_TYPE.COLLECTIBLE_SENT:
      return <CollectibleTransactionEventDetails event={event} chain={chain} />;
    case EVENT_TYPE.TOKEN_EXCHANGE:
      return <TokenExchangeEventDetails event={event} chain={chain} />;
    case EVENT_TYPE.EXCHANGE_FROM_FIAT:
      return <ExchangeFromFiatEventDetails event={event} chain={chain} />;
    case EVENT_TYPE.WALLET_CREATED:
    case EVENT_TYPE.WALLET_ACTIVATED:
      return <WalletEventDetails event={event} chain={chain} />;
    case EVENT_TYPE.ENS_NAME_REGISTERED:
      return <EnsNameEventDetails event={event} chain={chain} />;
    default:
      return null;
  }
}

export default HistoryEventDetails;
