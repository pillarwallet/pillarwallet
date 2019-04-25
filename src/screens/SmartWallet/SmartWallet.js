// @flow
import * as React from 'react';
import { Platform } from 'react-native';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { baseColors, fontSizes } from 'utils/variables';
import SmartWalletService from 'services/smartWallet';

import { Container, ScrollWrapper } from 'components/Layout';
import Header from 'components/Header';
import { BaseText, BoldText } from 'components/Typography';
import { ButtonMini } from 'components/Button';

type Props = {
  navigation: NavigationScreenProp<*>,
};

const Wrapper = styled.View`
  position: relative;
  margin: 5px 20px 20px;
  padding-top: ${Platform.select({
    ios: '20px',
    android: '14px',
  })};
`;

const TextRow = styled(BaseText)`
  padding-bottom: 10px;
  font-size: ${fontSizes.small}px;
  color: ${baseColors.darkGray};
`;

type SmartAccount = {
  address: string,
  deployMode: string,
  id: number,
  state: string,
  updatedAt: string,
};

export default class SmartWallet extends React.Component<Props, *> {
  sdk: Object;
  account: SmartAccount;

  state = {
    sdkInitialized: false,
    accountCreated: false,
  };

  componentDidMount() {
    this.sdk = new SmartWalletService();
    this.sdk.init()
      .then(() => this.setState({ sdkInitialized: true }))
      .catch(console.log);
  }

  createAccount = () => {
    this.sdk.createAccount()
      .then((account) => {
        this.account = account;
        this.setState({ accountCreated: true });
      })
      .catch(console.log);
  };

  render() {
    const { navigation } = this.props;
    const { sdkInitialized, accountCreated } = this.state;
    return (
      <Container inset={{ bottom: 0 }}>
        <Header
          title="Smart Wallet"
          onBack={() => navigation.goBack(null)}
        />
        <ScrollWrapper>
          <Wrapper>
            <TextRow>
              SDK Initialized: <BoldText>{sdkInitialized.toString()}</BoldText>
            </TextRow>
            <TextRow>
              Account created: <BoldText>{accountCreated.toString()}</BoldText>
            </TextRow>
            {sdkInitialized && !accountCreated && <ButtonMini title="Create" onPress={this.createAccount} />}
            {accountCreated && (
              <React.Fragment>
                <TextRow>Account address: {this.account.address}</TextRow>
                <TextRow>Account id: {this.account.id}</TextRow>
                <TextRow>Account state: {this.account.state}</TextRow>
                <TextRow>Account deploy mode: {this.account.deployMode}</TextRow>
              </React.Fragment>
            )}
          </Wrapper>
        </ScrollWrapper>
      </Container>
    );
  }
}
