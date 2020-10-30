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

import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { withNavigation } from 'react-navigation';
import isEmpty from 'lodash.isempty';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';

// components
import styled from 'styled-components/native';
import CircleButton from 'components/CircleButton';
import Modal from 'components/Modal';
import AddFundsModal from 'components/AddFundsModal';

// constants
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { SEND_TOKEN_FROM_HOME_FLOW, EXCHANGE } from 'constants/navigationConstants';

// selectors
import { activeAccountAddressSelector } from 'selectors';
import { accountBalancesSelector } from 'selectors/balances';

// utils
import { calculateBalanceInFiat } from 'utils/assets';
import { getSmartWalletStatus } from 'utils/smartWallet';

// models, types
import type { RootReducerState } from 'reducers/rootReducer';
import type { Balances, Rates } from 'models/Asset';
import type { NavigationScreenProp } from 'react-navigation';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts } from 'models/Account';
import type { SmartWalletReducerState } from 'reducers/smartWalletReducer';


type Props = {
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  activeAccountAddress: string,
  activeAccountBalances: Balances,
  rates: Rates,
  accounts: Accounts,
  smartWalletState: SmartWalletReducerState,
};

const Sizer = styled.View`
  max-width: 350px;
  align-items: center;
  align-self: center;
`;

const ActionButtonsWrapper = styled.View`
  width: 100%;
  padding: 14px 10px 36px;
  flex-direction: row;
  justify-content: space-between;
`;

const ActionButtons = ({
  navigation,
  activeAccountAddress,
  activeAccountBalances,
  baseFiatCurrency,
  rates,
  accounts,
  smartWalletState,
}: Props) => {
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

  const openAddFundsModal = useCallback(() => {
    Modal.open(() => <AddFundsModal receiveAddress={activeAccountAddress} />);
  }, [activeAccountAddress]);

  const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
  const isSendButtonActive = calculateBalanceInFiat(rates, activeAccountBalances, fiatCurrency)
    && isEmpty(smartWalletStatus?.sendingBlockedMessage);

  return (
    <Sizer>
      <ActionButtonsWrapper>
        <CircleButton
          label={t('button.addFunds')}
          fontIcon="qrDetailed"
          onPress={openAddFundsModal}
        />
        <CircleButton
          label={t('button.send')}
          fontIcon="paperPlane"
          onPress={() => navigation.navigate(SEND_TOKEN_FROM_HOME_FLOW)}
          disabled={!isSendButtonActive}
        />
        <CircleButton
          label={t('button.exchange')}
          fontIcon="exchange"
          onPress={() => navigation.navigate(EXCHANGE)}
        />
      </ActionButtonsWrapper>
    </Sizer>
  );
};

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
  rates: { data: rates },
  accounts: { data: accounts },
  smartWallet: smartWalletState,
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  rates,
  accounts,
  smartWalletState,
});

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
  activeAccountBalances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default withNavigation(connect(combinedMapStateToProps)(ActionButtons));
