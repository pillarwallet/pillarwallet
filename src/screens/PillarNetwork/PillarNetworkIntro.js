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
import styled from 'styled-components/native';
import { FlatList, Platform } from 'react-native';
import { CachedImage } from 'react-native-cached-image';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import { BoldText, MediumText } from 'components/Typography';
import Icon from 'components/Icon';
import Button from 'components/Button';
import SlideModal from 'components/Modals/SlideModal';
import CheckPin from 'components/CheckPin';
import { LabelBadge } from 'components/LabelBadge';

import { baseColors, fontStyles } from 'utils/variables';
import { responsiveSize } from 'utils/ui';
import { ASSETS, SMART_WALLET_INTRO } from 'constants/navigationConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';

import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';

import { delay } from 'utils/common';
import { getActiveAccount } from 'utils/accounts';

import { ensureSmartAccountConnectedAction, setPLRTankAsInitAction } from 'actions/smartWalletActions';
import { resetIncorrectPasswordAction } from 'actions/authActions';
import { switchAccountAction } from 'actions/accountsActions';
import { setActiveBlockchainNetworkAction } from 'actions/blockchainNetworkActions';

import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Accounts } from 'models/Account';
import { ListItemChevron } from 'components/ListItem/ListItemChevron';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import { getSmartWalletStatus } from 'utils/smartWallet';

type Props = {
  navigation: NavigationScreenProp<*>,
  addNetwork: Function,
  resetIncorrectPassword: Function,
  ensureSmartAccountConnected: Function,
  switchAccount: Function,
  accounts: Accounts,
  smartWalletState: Object,
  setPLRTankAsInit: Function,
  setActiveBlockchainNetwork: Function,
}
type State = {
  showPinScreenForAction: boolean,
  processingCreate: boolean,
}

const CustomWrapper = styled.View`
  flex: 1;
  padding: 20px 55px 40px 46px;
`;

const Title = styled(BoldText)`
  color: ${baseColors.pomegranate};
  ${fontStyles.rJumbo};
`;

const BodyText = styled(MediumText)`
  color: ${baseColors.pomegranate};
  ${fontStyles.rBig};
  margin-top: ${responsiveSize(26)}px;
`;

const ListItemWrapper = styled.View`
  flex-direction: row;
  justify-content: flex-start;
  margin-top: ${responsiveSize(19)}px;
`;

const ContentWrapper = styled.View`
  align-items: stretch;
  margin-left: ${responsiveSize(19)}px;
  flex: 1;
  flex-wrap: wrap;
`;

const Label = styled(MediumText)`
  color: ${baseColors.pomegranate};
  ${fontStyles.rLarge};
`;

const Subtext = styled(MediumText)`
  color: ${baseColors.pomegranate};
  ${fontStyles.rBig};
  margin-top: ${responsiveSize(10)}px;
`;

const FeatureIcon = styled(CachedImage)`
  height: 124px;
  width: 124px;
  margin-bottom: 24px;
`;

const Wrapper = styled.View`
  position: relative;
  margin: 5px 20px 20px;
  padding-top: ${Platform.select({
    ios: '20px',
    android: '14px',
  })};
`;

const ButtonWrapper = styled(Wrapper)`
  padding: 0 46px 20px;
`;

const features = [
  {
    key: 'instant',
    label: 'Instant.',
    subtext: 'No waiting for miner or block confirmations. Seriously instant transactions.',
  },
  {
    key: 'free',
    label: 'Free.',
    subtext: 'No need to pay network costs or gas for any transactions.',
  },
  {
    key: 'private',
    label: 'Private.',
    subtext: 'Only final settlement is recorded on-chain. ' +
      'Batched transactions allow multiple transfers to be combined.',
  },
];

const PPNIcon = require('assets/images/logo_PPN.png');

class PillarNetworkIntro extends React.Component<Props, State> {
  state = {
    showPinScreenForAction: false,
    processingCreate: false,
  };

  handleCheckPinModalClose = () => {
    const { resetIncorrectPassword } = this.props;
    resetIncorrectPassword();
    this.setState({
      showPinScreenForAction: false,
      processingCreate: false,
    });
  };

  goToPLRTank = async (_: string, wallet: Object) => {
    const {
      ensureSmartAccountConnected,
      navigation,
      accounts,
      switchAccount,
      setPLRTankAsInit,
      setActiveBlockchainNetwork,
    } = this.props;
    this.setState({ showPinScreenForAction: false });
    const activeAccount = getActiveAccount(accounts) || { type: '' };
    if (activeAccount.type === ACCOUNT_TYPES.KEY_BASED) {
      const smartAccount = (accounts.find((acc) => acc.type === ACCOUNT_TYPES.SMART_WALLET) || { id: '' });
      const { id: smartAccountId } = smartAccount;
      await switchAccount(smartAccountId, wallet.privateKey);
    }
    setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.PILLAR_NETWORK);
    await delay(500);
    ensureSmartAccountConnected(wallet.privateKey)
      .then(() => {
        this.setState({ processingCreate: false },
          () => {
            navigation.navigate(ASSETS);
            setPLRTankAsInit();
          });
      })
      .catch(() => null);
  };

  render() {
    const { showPinScreenForAction, processingCreate } = this.state;
    const { smartWalletState, accounts, navigation } = this.props;
    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    const needsSmartWallet = !smartWalletStatus.hasAccount;

    return (
      <ContainerWithHeader
        headerProps={{
          floating: true,
          transparent: true,
          light: true,
        }}
        backgroundColor={baseColors.ultramarine}
      >
        <ScrollWrapper contentContainerStyle={{ paddingTop: 80 }}>
          <CustomWrapper>
            <FeatureIcon source={PPNIcon} />
            <Title>
              Pillar Network
            </Title>
            <BodyText>
              Stake PLR tokens in your tank to enable free and instant transactions between you and your contacts.
              PLR acts as a meta token allowing you to send and receive any asset that is supported by the Pillar
              Payment Network.
            </BodyText>
            <LabelBadge
              label="COMING SOON"
              containerStyle={{ backgroundColor: baseColors.darkOrange, marginTop: 57, paddingVertical: 2 }}
              labelStyle={{ color: baseColors.ultramarine, fontSize: responsiveSize(11) }}
            />
            <BodyText style={{ marginTop: 10 }}>
              Draw from your PLR tank to send whatever you’d like.
            </BodyText>
            <FlatList
              data={features}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => (
                <ListItemWrapper>
                  <Icon
                    name="check"
                    style={{
                      fontSize: responsiveSize(13),
                      color: baseColors.pomegranate,
                      marginTop: responsiveSize(12),
                    }}
                  />
                  <ContentWrapper>
                    <Label>{item.label}</Label>
                    <Subtext>{item.subtext}</Subtext>
                  </ContentWrapper>
                </ListItemWrapper>
              )}
              style={{ marginTop: 20 }}
            />
          </CustomWrapper>
          {!!needsSmartWallet &&
          <ListItemChevron
            wrapperStyle={{
              marginTop: 46,
              marginBottom: 70,
              borderColor: baseColors.pomegranate,
            }}
            label="Enable Smart wallet to create Tank"
            onPress={() => navigation.navigate(SMART_WALLET_INTRO)}
            color={baseColors.pomegranate}
            bordered
          />}
          {!needsSmartWallet &&
          <ButtonWrapper>
            <Button
              block
              title="Go to PLR Tank"
              onPress={() => this.setState({ showPinScreenForAction: true, processingCreate: true })}
              style={{
                backgroundColor: baseColors.pomegranate,
                marginTop: 40,
                marginBottom: 20,
                opacity: needsSmartWallet ? 0.3 : 1,
              }}
              textStyle={{ color: baseColors.ultramarine }}
              isLoading={processingCreate}
            />
          </ButtonWrapper>}
        </ScrollWrapper>
        <SlideModal
          isVisible={!!showPinScreenForAction}
          onModalHide={this.handleCheckPinModalClose}
          title="Enter pincode"
          centerTitle
          fullScreen
          showHeader
        >
          <Wrapper flex={1}>
            <CheckPin
              onPinValid={this.goToPLRTank}
            />
          </Wrapper>
        </SlideModal>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  smartWallet: smartWalletState,
}: RootReducerState): $Shape<Props> => ({
  accounts,
  smartWalletState,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  switchAccount: (accountId: string, privateKey?: string) => dispatch(switchAccountAction(accountId, privateKey)),
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  ensureSmartAccountConnected: (privateKey: string) => dispatch(ensureSmartAccountConnectedAction(privateKey)),
  setPLRTankAsInit: () => dispatch(setPLRTankAsInitAction()),
  setActiveBlockchainNetwork: (id: string) => dispatch(setActiveBlockchainNetworkAction(id)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PillarNetworkIntro);
