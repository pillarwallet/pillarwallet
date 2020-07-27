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

import React, { useState } from 'react';
import { Platform } from 'react-native';
import { connect } from 'react-redux';
import { withNavigation } from 'react-navigation';
import isEmpty from 'lodash.isempty';
import { createStructuredSelector } from 'reselect';

// components
import styled from 'styled-components/native';
import CircleButton from 'components/CircleButton';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import ActionOptionsModal from 'components/ActionModal/ActionOptionsModal';

// constants
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { SEND_TOKEN_FROM_HOME_FLOW } from 'constants/navigationConstants';
import { EXCHANGE } from 'constants/exchangeConstants';

// actions
import { goToInvitationFlowAction } from 'actions/referralsActions';

// selectors
import { activeAccountAddressSelector } from 'selectors';
import { accountBalancesSelector } from 'selectors/balances';

// models, types
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { Balances } from 'models/Asset';
import type { NavigationScreenProp } from 'react-navigation';


type Props = {
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  activeAccountAddress: string,
  activeAccountBalances: Balances,
  goToInvitationFlow: () => void,
  rewardActive?: boolean,
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
  rewardActive,
  goToInvitationFlow,
}: Props) => {
  const [receiveAddress, setReceiveAddress] = useState('');
  const [visibleAddFundsModal, setVisibleAddFundsModal] = useState(false);

  const isSendButtonActive = !isEmpty(activeAccountBalances);
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

  const addFundsModalOptions = [
    {
      key: 'buy',
      label: `Buy with a card${Platform.OS === 'ios' ? ' or Apple Pay' : ''}`,
      iconName: 'wallet',
      onPress: () => navigation.navigate(EXCHANGE, { fromAssetCode: fiatCurrency }),
    },
    {
      key: 'receive',
      label: 'Send from another wallet',
      iconName: 'qrDetailed',
      onPress: () => setReceiveAddress(activeAccountAddress),
    },
    {
      key: 'exchange',
      label: 'Exchange',
      iconName: 'flip',
      onPress: () => navigation.navigate(EXCHANGE),
    },
    {
      key: 'invite',
      label: 'Invite and earn free tokens',
      iconName: 'present',
      hide: !rewardActive,
      onPress: goToInvitationFlow,
    },
  ];

  const closeAddFundsModal = (callback?: () => void) => {
    setVisibleAddFundsModal(false);
    if (callback) {
      const timer = setTimeout(() => {
        callback();
        clearTimeout(timer);
      }, 500);
    }
  };

  return (
    <React.Fragment>
      <Sizer>
        <ActionButtonsWrapper>
          <CircleButton
            label="Add Funds"
            fontIcon="qrDetailed"
            onPress={() => setVisibleAddFundsModal(true)}
          />
          <CircleButton
            label="Send"
            fontIcon="paperPlane"
            onPress={() => navigation.navigate(SEND_TOKEN_FROM_HOME_FLOW)}
            disabled={!isSendButtonActive}
          />
          <CircleButton
            label="Exchange"
            fontIcon="exchange"
            onPress={() => navigation.navigate(EXCHANGE)}
          />
        </ActionButtonsWrapper>
      </Sizer>
      <ActionOptionsModal
        onModalClose={closeAddFundsModal}
        isVisible={visibleAddFundsModal}
        items={addFundsModalOptions}
        title="Add funds to Pillar"
      />
      <ReceiveModal
        isVisible={!isEmpty(receiveAddress)}
        address={receiveAddress}
        onModalHide={() => setReceiveAddress('')}
      />
    </React.Fragment>
  );
};

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
});

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
  activeAccountBalances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  goToInvitationFlow: () => dispatch(goToInvitationFlowAction()),
});

export default withNavigation(connect(combinedMapStateToProps, mapDispatchToProps)(ActionButtons));
