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
import { SafeAreaView } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';

// components
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import { MediumText, BaseText } from 'components/Typography';
import Toast from 'components/Toast';
import { Spacing } from 'components/Layout';

// constants
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { ASSETS } from 'constants/navigationConstants';

// actions
import { switchAccountAction } from 'actions/accountsActions';
import { deploySmartWalletAction } from 'actions/smartWalletActions';

// utils
import { getActiveAccount } from 'utils/accounts';
import { images } from 'utils/images';

// types
import type { Accounts } from 'models/Account';
import type { Theme } from 'models/Theme';


type Props = {
  theme: Theme,
  navigation: NavigationScreenProp<*>,
  isVisible: Boolean,
  onClose: () => void,
  accounts: Accounts,
  deploySmartWallet: () => void,
  switchAccount: (accountId: string) => void,
};


const ModalContainer = styled.View`
  padding: 20px 0 40px;
`;


class SWActivationModal extends React.Component<Props> {
  activateSW = async () => {
    const {
      accounts,
      switchAccount,
      deploySmartWallet,
      navigation,
      onClose,
    } = this.props;
    const activeAccount = getActiveAccount(accounts) || { type: '' };

    if (activeAccount.type !== ACCOUNT_TYPES.SMART_WALLET) {
      const smartAccount = (accounts.find((acc) => acc.type === ACCOUNT_TYPES.SMART_WALLET));
      if (!smartAccount) {
        Toast.show({
          message: 'Smart Wallet not found',
          type: 'warning',
          title: 'Could not activate Smart Wallet',
          autoClose: false,
        });
        return;
      }
      await switchAccount(smartAccount.id);
    }

    deploySmartWallet();
    navigation.navigate(ASSETS);
    if (onClose) onClose();
  };

  render() {
    const { theme, isVisible, onClose } = this.props;
    const { smartWalletIcon } = images(theme);

    return (
      <SlideModal
        isVisible={isVisible}
        onModalHide={onClose}
        hideHeader
      >
        <SafeAreaView>
          <ModalContainer>
            <MediumText center medium>Activate Smart Wallet</MediumText>
            <Spacing h={18} />
            <CachedImage
              style={{ width: 64, height: 64, alignSelf: 'center' }}
              source={smartWalletIcon}
            />
            <Spacing h={20} />
            <BaseText medium>
              To start sending and exchanging assets you need to activate your wallet.
            </BaseText>
            <Spacing h={34} />
            <Button
              secondary
              title="Activate"
              onPress={this.activateSW}
              regularText
            />
          </ModalContainer>
        </SafeAreaView>
      </SlideModal>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
}) => ({
  accounts,
});

const mapDispatchToProps = (dispatch: Function) => ({
  deploySmartWallet: () => dispatch(deploySmartWalletAction()),
  switchAccount: (accountId: string) => dispatch(switchAccountAction(accountId)),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(SWActivationModal));
