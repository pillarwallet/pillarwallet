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
import get from 'lodash.get';
import type { NavigationScreenProp } from 'react-navigation';
import { utils } from 'ethers';
import { BigNumber } from 'bignumber.js';

import { Container, Footer, ScrollWrapper } from 'components/Layout';
import { Label, BoldText } from 'components/Typography';
import Button from 'components/Button';
import Header from 'components/Header';
import { fontSizes } from 'utils/variables';
import { estimateTopUpVirtualAccountAction, topUpVirtualAccountAction } from 'actions/smartWalletActions';
import { formatAmount } from 'utils/common';
import type { TopUpFee } from 'models/PaymentNetwork';


type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
  topUpFee: TopUpFee,
  estimateTopUpVirtualAccount: Function,
  topUpVirtualAccount: Function,
};

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

class FundConfirm extends React.Component<Props> {
  componentDidMount() {
    this.props.estimateTopUpVirtualAccount();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.session.isOnline !== this.props.session.isOnline && this.props.session.isOnline) {
      this.props.estimateTopUpVirtualAccount();
    }
  }

  handleFormSubmit = async () => {
    const { navigation, topUpVirtualAccount } = this.props;
    const amount = navigation.getParam('amount', '0');
    await topUpVirtualAccount(amount);
    navigation.dismiss();
  };

  getTxFeeInWei = (): BigNumber => {
    return get(this.props, 'topUpFee.feeInfo.totalCost', 0);
  };

  render() {
    const { session, navigation, topUpFee } = this.props;
    const amount = navigation.getParam('amount', '0');
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
            <Label>Amount</Label>
            <Value>{amount} ETH</Value>
          </LabeledRow>
          <LabeledRow>
            <Label>Recipient username</Label>
            <Value>Pillar Tank</Value>
          </LabeledRow>
          <LabeledRow>
            <Label>Transaction fee</Label>
            <Value>{feeInEth} ETH</Value>
          </LabeledRow>
        </ScrollWrapper>
        <Footer keyboardVerticalOffset={40}>
          <FooterWrapper>
            <Button
              disabled={!session.isOnline || !topUpFee.isFetched}
              onPress={this.handleFormSubmit}
              title="Fund Pillar Tank"
            />
          </FooterWrapper>
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  paymentNetwork: { topUpFee },
}) => ({
  session,
  topUpFee,
});

const mapDispatchToProps = (dispatch) => ({
  topUpVirtualAccount: (amount: string) => dispatch(topUpVirtualAccountAction(amount)),
  estimateTopUpVirtualAccount: () => dispatch(estimateTopUpVirtualAccountAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(FundConfirm);
