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
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { createStructuredSelector } from 'reselect';

// components
import { LightText } from 'components/Typography';
import Tank from 'components/Tank';

// constants
import { MANAGE_WALLETS_FLOW, UPGRADE_TO_SMART_WALLET_FLOW, TANK_DETAILS } from 'constants/navigationConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// selectors
import { activeAccountSelector } from 'selectors';
import { availableStakeSelector } from 'selectors/paymentNetwork';

// types
import type { Account } from 'models/Account';

// utils
import { baseColors, fontSizes } from 'utils/variables';

// local components
import { ManageWalletsButton } from './ManageWalletsButton';


type Props = {
  isSmartWallet: boolean,
  navigation: NavigationScreenProp<*>,
  activeAccount: Account,
  availableStake: number,
};

const TankButton = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  min-height: 20px;
  margin-left: 14px;
`;

const TankLabel = styled(LightText)`
  font-size: ${fontSizes.extraSmall}px;
  line-height: ${fontSizes.extraSmall}px;
  color: ${baseColors.darkGray};
  margin-bottom: -4px;
`;

const UpgradeButton = styled.TouchableOpacity`
  justify-content: flex-end;
  align-items: center;
  min-height: 20px;
  margin-left: 14px;
`;

const UpgradeLabel = styled(LightText)`
  font-size: ${fontSizes.extraSmall}px;
  line-height: ${fontSizes.extraSmall}px;
  color: ${baseColors.darkGray};
  margin-bottom: -2px;
`;

class HeaderButtonsForSmartWallet extends React.Component<Props> {
  renderSmartWalletButtons() {
    const {
      navigation,
      activeAccount,
      availableStake,
    } = this.props;
    const { type: walletType } = activeAccount;
    const showChannelStatus = activeAccount.type === ACCOUNT_TYPES.SMART_WALLET;
    const tankValue = availableStake;
    const tankTotalValue = availableStake + 10;
    const tankLabel = tankValue > 0 ? tankValue : 'PLR Tank';

    return (
      <React.Fragment>
        <ManageWalletsButton
          onPress={() => navigation.navigate(MANAGE_WALLETS_FLOW)}
          label={walletType === ACCOUNT_TYPES.KEY_BASED ? 'Key Based Wallet' : 'Smart.Wallet'}
          labelColor={walletType === ACCOUNT_TYPES.KEY_BASED
            ? baseColors.deepSkyBlue
            : baseColors.fireEngineRed
          }
        />
        {showChannelStatus &&
        <TankButton onPress={() => navigation.navigate(TANK_DETAILS)}>
          <TankLabel>{tankLabel}</TankLabel>
          <Tank value={tankValue} totalValue={tankTotalValue} tiny wrapperStyle={{ marginLeft: 6 }} />
        </TankButton>
        }
      </React.Fragment>
    );
  }

  renderUpgradeButton() {
    const { navigation } = this.props;
    return (
      <UpgradeButton onPress={() => navigation.navigate(UPGRADE_TO_SMART_WALLET_FLOW)}>
        <UpgradeLabel>Upgrade</UpgradeLabel>
      </UpgradeButton>
    );
  }

  render() {
    const { isSmartWallet } = this.props;
    return isSmartWallet ? this.renderSmartWalletButtons() : this.renderUpgradeButton();
  }
}

const structuredSelector = createStructuredSelector({
  activeAccount: activeAccountSelector,
  availableStake: availableStakeSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  // ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(HeaderButtonsForSmartWallet);
