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
import { Platform } from 'react-native';
import { withNavigation } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { baseColors, fontSizes, UIColors } from 'utils/variables';
import { getSmartWalletStatus } from 'utils/smartWallet';
import { BaseText } from 'components/Typography';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { MANAGE_WALLETS_FLOW, UPGRADE_TO_SMART_WALLET_FLOW } from 'constants/navigationConstants';
import Icon from 'components/Icon';
import type { Accounts } from 'models/Account';

type Props = {
  smartWalletFeatureEnabled: boolean,
  theme: Object,
  activeAccount: Object,
  accounts: Accounts,
  smartWalletState: Object,
  navigation: NavigationScreenProp<*>,
}

const HeaderButtonRounded = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 5px 12px;
  border: 1px solid;
  border-color: ${props => props.theme.buttonBorderColor || UIColors.defaultBorderColor};
  border-radius: 20px;
  margin-right: 6px;
`;

const RoundedButtonLabel = styled(BaseText)`
  line-height: ${fontSizes.small};
  font-size: ${fontSizes.extraSmall}px;
  color: ${props => props.theme.buttonLabelColor || UIColors.defaultTextColor};
  font-weight: ${Platform.select({
    ios: '500',
    android: '400',
  })};
`;
const ChevronIcon = styled(Icon)`
  font-size: 6px;
  color: ${baseColors.white};
  transform: rotate(90deg);
  margin-top: 2px;
  margin-left: 9px;
`;

class AssetManagementButton extends React.PureComponent<Props> {
  render() {
    const {
      smartWalletFeatureEnabled,
      theme,
      activeAccount,
      accounts,
      smartWalletState,
      navigation,
    } = this.props;

    const { type: walletType } = activeAccount;
    const walletTypeLabel = walletType === ACCOUNT_TYPES.KEY_BASED ? 'Key wallet' : 'Smart wallet';
    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);

    const isSmartWallet = smartWalletStatus.hasAccount;

    if (smartWalletFeatureEnabled) {
      if (isSmartWallet) {
        return (
          <HeaderButtonRounded onPress={() => navigation.navigate(MANAGE_WALLETS_FLOW)} theme={theme}>
            <RoundedButtonLabel theme={theme}>{walletTypeLabel}</RoundedButtonLabel>
            <ChevronIcon name="chevron-right" />
          </HeaderButtonRounded>
        );
      }

      return (
        <HeaderButtonRounded onPress={() => navigation.navigate(UPGRADE_TO_SMART_WALLET_FLOW)} theme={theme}>
          <RoundedButtonLabel theme={theme}>Upgrade</RoundedButtonLabel>
        </HeaderButtonRounded>
      );
    }
    return null;
  }
}

export default withNavigation(AssetManagementButton);
