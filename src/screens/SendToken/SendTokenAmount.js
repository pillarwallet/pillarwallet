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
import * as React from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

// components
import SendAsset from 'components/SendAsset';

// types
import type { NavigationScreenProp } from 'react-navigation';
import type { RootReducerState } from 'reducers/rootReducer';
import type { SessionData } from 'models/Session';
import type { AccountAssetBalances } from 'models/Balances';

// selectors
import { accountAssetsBalancesSelector } from 'selectors/balances';


type Props = {
  navigation: NavigationScreenProp<*>,
  accountAssetsBalances: AccountAssetBalances,
  session: SessionData,
};

const SendTokenAmount = ({
  navigation,
  accountAssetsBalances,
  session,
}: Props) => {
  const defaultContact = navigation.getParam('contact');
  const source = navigation.getParam('source', '');

  return (
    <SendAsset
      navigation={navigation}
      defaultContact={defaultContact}
      source={source}
      accountAssetsBalances={accountAssetsBalances}
      session={session}
    />
  );
};

const mapStateToProps = ({
  session: { data: session },
}: RootReducerState): $Shape<Props> => ({
  session,
});

const structuredSelector = createStructuredSelector({
  accountAssetsBalances: accountAssetsBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(SendTokenAmount);
