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

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import { Label, MediumText } from 'components/Typography';
import Button from 'components/Button';
import { fontSizes, spacing } from 'utils/variables';
import { estimateTopUpVirtualAccountAction, topUpVirtualAccountAction } from 'actions/smartWalletActions';
import { formatAmount } from 'utils/common';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { TopUpFee } from 'models/PaymentNetwork';
import { PPN_TOKEN } from 'configs/assetsConfig';
import { ASSETS } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
  topUpFee: TopUpFee,
  estimateTopUpVirtualAccount: (amount: string) => void,
  topUpVirtualAccount: (amount: string) => void,
};

type State = {
  topUpButtonSubmitted: boolean,
};

const FooterWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: ${spacing.large}px;
  width: 100%;
`;

const LabeledRow = styled.View`
  margin: 10px 0;
`;

const Value = styled(MediumText)`
  font-size: ${fontSizes.big}px;
`;

class FundConfirm extends React.Component<Props, State> {
  state = {
    topUpButtonSubmitted: false,
  };

  componentDidMount() {
    this.callEstimateMethod();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.session.isOnline !== this.props.session.isOnline && this.props.session.isOnline) {
      this.callEstimateMethod();
    }
  }

  callEstimateMethod() {
    const { navigation, estimateTopUpVirtualAccount } = this.props;
    const amount = navigation.getParam('amount', '0');
    estimateTopUpVirtualAccount(amount);
  }

  handleFormSubmit = async () => {
    const { navigation, topUpVirtualAccount } = this.props;
    this.setState({ topUpButtonSubmitted: true });
    const amount = navigation.getParam('amount', '0');
    await topUpVirtualAccount(amount);
    this.setState({ topUpButtonSubmitted: false }, () => navigation.navigate(ASSETS));
  };

  getTxFeeInWei = (): BigNumber => {
    return get(this.props, 'topUpFee.feeInfo.totalCost', 0);
  };

  render() {
    const { session, navigation, topUpFee } = this.props;
    const { topUpButtonSubmitted } = this.state;
    const amount = navigation.getParam('amount', '0');
    const feeInEth = formatAmount(utils.formatEther(this.getTxFeeInWei().toString()));
    const submitButtonTitle = !topUpButtonSubmitted ? 'Fund Pillar Tank' : 'Processing...';

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Review and confirm' }] }}
        keyboardAvoidFooter={(
          <FooterWrapper>
            <Button
              disabled={!session.isOnline || !topUpFee.isFetched || topUpButtonSubmitted}
              onPress={this.handleFormSubmit}
              title={submitButtonTitle}
            />
          </FooterWrapper>
        )}
      >
        <ScrollWrapper
          regularPadding
          contentContainerStyle={{ marginTop: 40 }}
        >
          <LabeledRow>
            <Label>Amount</Label>
            <Value>{amount} {PPN_TOKEN}</Value>
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
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  paymentNetwork: { topUpFee },
}: RootReducerState): $Shape<Props> => ({
  session,
  topUpFee,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  topUpVirtualAccount: (amount: string) => dispatch(topUpVirtualAccountAction(amount)),
  estimateTopUpVirtualAccount: (amount: string) => dispatch(estimateTopUpVirtualAccountAction(amount)),
});

export default connect(mapStateToProps, mapDispatchToProps)(FundConfirm);
