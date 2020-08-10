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
import t from 'translations/translate';

// components
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import { MediumText, BaseText } from 'components/Typography';
import { Spacing } from 'components/Layout';

// constants
import { ASSETS } from 'constants/navigationConstants';

// actions
import { deploySmartWalletAction } from 'actions/smartWalletActions';

// utils
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
      deploySmartWallet,
      navigation,
      onClose,
    } = this.props;

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
            <MediumText center medium>{t('smartWalletContent.activationModal.title')}</MediumText>
            <Spacing h={18} />
            <CachedImage
              style={{ width: 64, height: 64, alignSelf: 'center' }}
              source={smartWalletIcon}
            />
            <Spacing h={20} />
            <BaseText medium>{t('smartWalletContent.activationModal.paragraph')}</BaseText>
            <Spacing h={34} />
            <Button
              secondary
              title={t('button.activate')}
              onPress={this.activateSW}
              regularText
            />
          </ModalContainer>
        </SafeAreaView>
      </SlideModal>
    );
  }
}

const mapDispatchToProps = (dispatch: Function) => ({
  deploySmartWallet: () => dispatch(deploySmartWalletAction()),
});

export default withTheme(connect(null, mapDispatchToProps)(SWActivationModal));
