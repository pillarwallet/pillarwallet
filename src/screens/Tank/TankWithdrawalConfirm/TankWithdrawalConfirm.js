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
import {
  estimateWithdrawFromVirtualAccountAction,
  withdrawFromVirtualAccountAction,
} from 'actions/smartWalletActions';
import { formatAmount } from 'utils/common';
import type { WithdrawalFee } from 'models/PaymentNetwork';
import { PPN_TOKEN } from 'configs/assetsConfig';
import { ASSETS } from 'constants/navigationConstants';


type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
  withdrawalFee: WithdrawalFee,
  estimateWithdrawFromVirtualAccount: Function,
  withdrawFromVirtualAccount: Function,
};

type State = {
  buttonSubmitted: boolean,
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

class TankWithdrawalConfirm extends React.Component<Props, State> {
  state = {
    buttonSubmitted: false,
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
    const { navigation, estimateWithdrawFromVirtualAccount } = this.props;
    const amount = navigation.getParam('amount', '0');
    estimateWithdrawFromVirtualAccount(amount);
  }

  handleFormSubmit = async () => {
    const { navigation, withdrawFromVirtualAccount } = this.props;
    this.setState({ buttonSubmitted: true });
    const amount = navigation.getParam('amount', '0');
    await withdrawFromVirtualAccount(amount);
    this.setState({ buttonSubmitted: false }, () => navigation.navigate(ASSETS));
  };

  getTxFeeInWei = (): BigNumber => {
    return get(this.props, 'withdrawalFee.feeInfo.totalCost', 0);
  };

  render() {
    const { session, navigation, withdrawalFee } = this.props;
    const { buttonSubmitted } = this.state;
    const amount = navigation.getParam('amount', '0');
    const feeInEth = formatAmount(utils.formatEther(this.getTxFeeInWei().toString()));

    const submitButtonTitle = buttonSubmitted
      ? 'Processing...'
      : 'Withdraw from PLR tank';

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Review and confirm' }] }}
        footer={(
          <FooterWrapper>
            <Button
              disabled={!session.isOnline || !withdrawalFee.isFetched || buttonSubmitted}
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
            <Value>Main Account</Value>
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
  paymentNetwork: { withdrawalFee },
}) => ({
  session,
  withdrawalFee,
});

const mapDispatchToProps = (dispatch) => ({
  withdrawFromVirtualAccount: (amount: string) => dispatch(withdrawFromVirtualAccountAction(amount)),
  estimateWithdrawFromVirtualAccount: (amount: string) => dispatch(estimateWithdrawFromVirtualAccountAction(amount)),
});

export default connect(mapStateToProps, mapDispatchToProps)(TankWithdrawalConfirm);
