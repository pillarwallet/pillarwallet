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
import { connect } from 'react-redux';
import { withNavigation } from 'react-navigation';
import isEmpty from 'lodash.isempty';
import { createStructuredSelector } from 'reselect';

// components
import styled from 'styled-components/native';
import CircleButton from 'components/CircleButton';
import ReceiveModal from 'screens/Asset/ReceiveModal';

// constants
import { SEND_TOKEN_FROM_HOME_FLOW } from 'constants/navigationConstants';
import { EXCHANGE } from 'constants/exchangeConstants';

// selectors
import { activeAccountAddressSelector } from 'selectors';

// models, types
import type { RootReducerState } from 'reducers/rootReducer';
import type { NavigationScreenProp } from 'react-navigation';


type Props = {
  navigation: NavigationScreenProp<*>,
  isSendButtonActive: boolean,
  activeAccountAddress: string,
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
  isSendButtonActive,
  navigation,
  activeAccountAddress,
}: Props) => {
  const [receiveAddress, setReceiveAddress] = useState('');
  return (
    <React.Fragment>
      <Sizer>
        <ActionButtonsWrapper>
          <CircleButton
            label="Receive"
            fontIcon="qrDetailed"
            onPress={() => setReceiveAddress(activeAccountAddress)}
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
      <ReceiveModal
        isVisible={!!receiveAddress}
        address={receiveAddress}
        onModalHide={() => setReceiveAddress('')}
      />
    </React.Fragment>
  );
};

const mapStateToProps = ({
  balances: { data: balances },
}: RootReducerState): $Shape<Props> => ({
  isSendButtonActive: !isEmpty(balances),
});

const structuredSelector = createStructuredSelector({
  activeAccountAddress: activeAccountAddressSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default withNavigation(connect(combinedMapStateToProps)(ActionButtons));
