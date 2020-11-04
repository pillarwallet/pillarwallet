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
import { ScrollView, Linking } from 'react-native';
import styled from 'styled-components/native';
import t from 'translations/translate';

// utils
import { fontStyles } from 'utils/variables';

// services
import smartWalletInstance from 'services/smartWallet';

// components
import { BaseText, MediumText } from 'components/Typography';
import Button from 'components/Button';
import { Spacing } from 'components/Layout';
import Toast from 'components/Toast';


const Title = styled(MediumText)`
  ${fontStyles.large};
  margin: 0 14px;
  text-align: center;
`;

const Text = styled(BaseText)`
  ${fontStyles.medium};
  margin: 35px 0;
`;

const ButtonsWrapper = styled.View`
  width: 100%;
  margin-bottom: 32px;
`;

type Props = {
  deploymentHash: string,
};


class WalletActivation extends React.PureComponent<Props> {
  handleFaq = () => {
    Linking.openURL('https://help.pillarproject.io/en/articles/3935106-smart-wallet-faq');
  };

  handleEtherscan = () => {
    const { deploymentHash } = this.props;
    if (!deploymentHash) {
      Toast.show({
        message: t('toast.cannotFindDeploymentHash'),
        emoji: 'woman-shrugging',
        supportLink: true,
        autoClose: false,
      });
      return;
    }

    const explorerLink = smartWalletInstance.getConnectedAccountTransactionExplorerLink(deploymentHash);
    if (!explorerLink) {
      Toast.show({
        message: t('toast.cannotGetBlockchainExplorerLink'),
        emoji: 'woman-shrugging',
        supportLink: true,
        autoClose: false,
      });
      return;
    }

    Linking.openURL(explorerLink);
  };

  render() {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16, paddingVertical: 20, justifyContent: 'center', flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Title>{t('smartWalletContent.walletActivationView.title')}</Title>
        <Text>{t('smartWalletContent.walletActivationView.paragraph.smartWalletActivating')}</Text>
        <ButtonsWrapper>
          <Button
            title={t('button.smartWalletFAQ')}
            onPress={this.handleFaq}
          />
          <Spacing h={4} />
          <Button
            transparent
            title={t('button.seeOnEtherscan')}
            onPress={this.handleEtherscan}
            style={{ borderColor: 'transparent' }}
          />
        </ButtonsWrapper>
      </ScrollView>
    );
  }
}
export default WalletActivation;
