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
import { BigNumber } from 'bignumber.js';
import get from 'lodash.get';
import { utils } from 'ethers';
import type { NavigationScreenProp } from 'react-navigation';

import { Container, Footer, ScrollWrapper } from 'components/Layout';
import { Label, BoldText } from 'components/Typography';
import Button from 'components/Button';
import Header from 'components/Header';
import { settleBalancesAction } from 'actions/smartWalletActions';
import type { SettleBalanceFee } from 'models/PaymentNetwork';
import { fontSizes } from 'utils/variables';
import { formatAmount } from 'utils/common';

type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
  settleBalances: Function,
  assetsOnNetwork: Object[],
  settleBalanceFee: SettleBalanceFee,
};

type State = {
  settleButtonSubmitted: boolean,
};

const FooterWrapper = styled.View`
  flex-direction: column;
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

/*
const TextButton = styled.TouchableOpacity`
  padding: 10px;
  margin-top: 10px;
`;

const ButtonText = styled(MediumText)`
  font-size: ${fontSizes.medium};
  letter-spacing: 0.1;
  color: #c95c45;
`;
*/

class SettleBalanceConfirm extends React.Component<Props, State> {
  state = {
    settleButtonSubmitted: false,
  };

  handleFormSubmit = async () => {
    const { navigation, settleBalances } = this.props;
    this.setState({ settleButtonSubmitted: true });
    const assetsToSettle = navigation.getParam('assetsToSettle', []);
    await settleBalances(assetsToSettle);
    this.setState({ settleButtonSubmitted: false }, () => navigation.dismiss());
  };

  getTxFeeInWei = (): BigNumber => {
    return get(this.props, 'settleBalanceFee.feeInfo.totalCost', 0);
  };

  render() {
    const { settleButtonSubmitted } = this.state;
    const { session, navigation, settleBalanceFee } = this.props;
    const assetsToSettle = navigation.getParam('assetsToSettle', []);
    const feeInEth = formatAmount(utils.formatEther(this.getTxFeeInWei()));

    return (
      <Container>
        <Header
          onBack={() => navigation.goBack(null)}
          title="review"
          white
        />
        <ScrollWrapper
          regularPadding
          contentContainerStyle={{ marginTop: 40 }}
        >
          <LabeledRow>
            <Label>Assets to settle</Label>
            {assetsToSettle.map((asset: Object, index: number) =>
              <Value key={index}>{`${formatAmount(asset.balance)} ${asset.symbol}`}</Value>)
            }
          </LabeledRow>
          <LabeledRow>
            <Label>Transaction fee</Label>
            <Value>{feeInEth} ETH</Value>
          </LabeledRow>
        </ScrollWrapper>
        <Footer keyboardVerticalOffset={40}>
          <FooterWrapper>
            <Button
              disabled={!session.isOnline || !settleBalanceFee.isFetched || settleButtonSubmitted}
              onPress={this.handleFormSubmit}
              title="Release Funds"
            />
            {/* <TextButton onPress={() => {}}>
              <ButtonText>Open dispute</ButtonText>
            </TextButton> */}
          </FooterWrapper>
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  paymentNetwork: { settleBalanceFee },
}) => ({
  session,
  settleBalanceFee,
});

const mapDispatchToProps = (dispatch) => ({
  settleBalances: (assets) => dispatch(settleBalancesAction(assets)),
});

export default connect(mapStateToProps, mapDispatchToProps)(SettleBalanceConfirm);
