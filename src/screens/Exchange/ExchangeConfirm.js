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
import { View, Platform } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { utils } from 'ethers';

import { Container, Footer, ScrollWrapper } from 'components/Layout';
import Header from 'components/Header';
import Button from 'components/Button';
import { BoldText, Label, Paragraph, TextLink } from 'components/Typography';
import SlideModal from 'components/Modals/SlideModal';
import ButtonText from 'components/ButtonText';

import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';

import { baseColors, fontSizes, spacing } from 'utils/variables';
import { formatAmount, getCurrencySymbol } from 'utils/common';
import { getRate } from 'utils/assets';

import { fetchGasInfoAction } from 'actions/historyActions';

import type { GasInfo } from 'models/GasInfo';
import type { Rates } from 'models/Asset';
import type { OfferOrder } from 'models/Offer';

const FooterWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  width: 100%;
`;


const LabeledRow = styled.View`
  margin: 10px 0;
`;

const Value = styled(BoldText)`
  font-size: ${fontSizes.medium}
`;

const SpeedButton = styled(Button)`
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
`;

const ButtonWrapper = styled.View`
  margin-top: ${spacing.rhythm / 2}px;
  margin-bottom: ${spacing.rhythm + 10}px;
`;

type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
  fetchGasInfo: Function,
  gasInfo: GasInfo,
  rates: Rates,
  baseFiatCurrency: string,
};

type State = {
  showFeeModal: boolean,
  transactionSpeed: string,
}

const SLOW = 'min';
const NORMAL = 'avg';
const FAST = 'max';

const SPEED_TYPES = {
  [SLOW]: 'Slow',
  [NORMAL]: 'Normal',
  [FAST]: 'Fast',
};
const GAS_LIMIT = 500000;

class ExchangeConfirmScreen extends React.Component<Props, State> {
  state = {
    showFeeModal: false,
    transactionSpeed: NORMAL,
  };

  componentDidMount() {
    const { fetchGasInfo } = this.props;
    fetchGasInfo();
  }

  getTxFeeInWei = (txSpeed?: string) => {
    txSpeed = txSpeed || this.state.transactionSpeed;
    const { gasInfo } = this.props;
    const gasPrice = gasInfo.gasPrice[txSpeed] || 0;
    const gasPriceWei = utils.parseUnits(gasPrice.toString(), 'gwei');
    return gasPriceWei.mul(GAS_LIMIT);
  };

  renderTxSpeedButtons = () => {
    const { rates, baseFiatCurrency } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    return Object.keys(SPEED_TYPES).map(txSpeed => {
      const feeInEth = formatAmount(utils.formatEther(this.getTxFeeInWei(txSpeed)));
      const feeInFiat = parseFloat(feeInEth) * getRate(rates, ETH, fiatCurrency);
      return (
        <SpeedButton
          key={txSpeed}
          primaryInverted
          onPress={() => this.handleGasPriceChange(txSpeed)}
        >
          <TextLink>{SPEED_TYPES[txSpeed]} - {feeInEth} ETH</TextLink>
          <Label>{`${getCurrencySymbol(fiatCurrency)}${feeInFiat.toFixed(2)}`}</Label>
        </SpeedButton>
      );
    });
  };

  handleGasPriceChange = (txSpeed: string) => {
    this.setState({
      transactionSpeed: txSpeed,
      showFeeModal: false,
    });
  };

  render() {
    const { showFeeModal, transactionSpeed } = this.state;
    const {
      navigation,
      session,
    } = this.props;

    const offerOrder: OfferOrder = navigation.getParam('offerOrder', {});
    const {
      receiveAmount,
      payAmount,
      toAssetCode,
      fromAssetCode,
    } = offerOrder;

    return (
      <Container color={baseColors.snowWhite} inset={{ bottom: 0 }}>
        <Header title="exchange" onBack={() => navigation.goBack(null)} />
        <ScrollWrapper regularPadding>
          <Paragraph style={{ marginBottom: 30 }}>
            Review the details and confirm the exchange rate as well as the cost of transaction.
          </Paragraph>
          <LabeledRow>
            <Label>Amount to receive</Label>
            <Value>{`${receiveAmount} ${toAssetCode}`}</Value>
          </LabeledRow>
          <LabeledRow>
            <Label>Amount to pay</Label>
            <Value>{`${payAmount} ${fromAssetCode}`}</Value>
          </LabeledRow>
          <LabeledRow>
            <Label>Transaction fee</Label>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <Value>{formatAmount(utils.formatEther(this.getTxFeeInWei(transactionSpeed)))} ETH</Value>
              <ButtonText
                buttonText="Change"
                onPress={() => this.setState({ showFeeModal: true })}
                wrapperStyle={{ marginLeft: 8, marginBottom: Platform.OS === 'ios' ? 2 : -1 }}
              />
            </View>
          </LabeledRow>
        </ScrollWrapper>
        <Footer keyboardVerticalOffset={40}>
          <FooterWrapper>
            <Button disabled={!session.isOnline} onPress={() => {}} title="Confirm Transaction" />
          </FooterWrapper>
        </Footer>
        <SlideModal
          isVisible={showFeeModal}
          title="transaction speed"
          onModalHide={() => { this.setState({ showFeeModal: false }); }}
        >
          <Label>Choose your gas price.</Label>
          <Label>Faster transaction requires more fee.</Label>
          <ButtonWrapper>{this.renderTxSpeedButtons()}</ButtonWrapper>
        </SlideModal>
      </Container>
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  history: { gasInfo },
}) => ({
  session,
  rates,
  baseFiatCurrency,
  gasInfo,
});

const mapDispatchToProps = (dispatch) => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(ExchangeConfirmScreen);
