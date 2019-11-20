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
import { Platform } from 'react-native';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';

import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import { BoldText, MediumText } from 'components/Typography';
import Button from 'components/Button';
import SlideModal from 'components/Modals/SlideModal';
import CheckPin from 'components/CheckPin';
import { LabelBadge } from 'components/LabelBadge';

import { baseColors, fontStyles } from 'utils/variables';
import { responsiveSize } from 'utils/ui';

import { resetIncorrectPasswordAction } from 'actions/authActions';
import { setActiveBlockchainNetworkAction } from 'actions/blockchainNetworkActions';
import { initializeBitcoinWalletAction } from 'actions/bitcoinActions';
import { ASSETS } from 'constants/navigationConstants';

import type { EthereumWallet } from 'models/Wallet';
import type { Dispatch } from 'reducers/rootReducer';

type Props = {
  navigation: NavigationScreenProp<*>,
  initializeBitcoinWallet: (wallet: EthereumWallet) => void,
  resetIncorrectPassword: () => void,
  setActiveBlockchainNetwork: (id: string) => void,
};

type State = {
  showPinScreenForAction: boolean,
  processingCreate: boolean,
};

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

class BitcoinNetworkIntro extends React.Component<Props, State> {
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

  initializeBTC = async (_: string, wallet: EthereumWallet) => {
    const {
      navigation,
      setActiveBlockchainNetwork,
      initializeBitcoinWallet,
    } = this.props;

    initializeBitcoinWallet(wallet);
    setActiveBlockchainNetwork(BLOCKCHAIN_NETWORK_TYPES.BITCOIN);
    this.setState({ showPinScreenForAction: false }, () => {
      navigation.navigate(ASSETS);
    });
  };

  render() {
    const { showPinScreenForAction, processingCreate } = this.state;

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
            <Title>
              Bitcoin Network
            </Title>
            <BodyText>
              Use the Bitcoin network.
            </BodyText>
            <LabelBadge
              label="COMING SOON"
              containerStyle={{ backgroundColor: baseColors.darkOrange, marginTop: 57, paddingVertical: 2 }}
              labelStyle={{ color: baseColors.ultramarine, fontSize: responsiveSize(11) }}
            />
            <BodyText style={{ marginTop: 10 }}>
              Send&Receive Bitcoin.
            </BodyText>
          </CustomWrapper>
          <ButtonWrapper>
            <Button
              block
              title="Go to the BTC Network"
              onPress={() => this.setState({ showPinScreenForAction: true, processingCreate: true })}
              style={{
                backgroundColor: baseColors.pomegranate,
                marginTop: 40,
                marginBottom: 20,
              }}
              textStyle={{ color: baseColors.ultramarine }}
              isLoading={processingCreate}
            />
          </ButtonWrapper>
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
            <CheckPin onPinValid={this.initializeBTC} />
          </Wrapper>
        </SlideModal>
      </ContainerWithHeader>
    );
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  resetIncorrectPassword: () => dispatch(resetIncorrectPasswordAction()),
  setActiveBlockchainNetwork: (id: string) => dispatch(setActiveBlockchainNetworkAction(id)),
  initializeBitcoinWallet: (wallet: EthereumWallet) => dispatch(
    initializeBitcoinWalletAction(wallet),
  ),
});

export default connect(mapDispatchToProps)(BitcoinNetworkIntro);
