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
import { createStructuredSelector } from 'reselect';
import { BigNumber } from 'bignumber.js';
import get from 'lodash.get';
import { utils } from 'ethers';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { settleTransactionsAction, estimateSettleBalanceAction } from 'actions/smartWalletActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import { Label, MediumText } from 'components/Typography';
import Button from 'components/Button';
import Toast from 'components/Toast';

// selectors
import { accountBalancesSelector } from 'selectors/balances';

// types
import type { Balances } from 'models/Asset';
import type { SettleTxFee, TxToSettle } from 'models/PaymentNetwork';

// utils
import { checkIfEnoughForFee } from 'utils/assets';
import { fontSizes, spacing } from 'utils/variables';
import { formatAmount } from 'utils/common';
import Spinner from 'components/Spinner';


type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
  settleTransactions: Function,
  settleTxFee: SettleTxFee,
  balances: Balances,
  estimateSettleBalance: Function,
};

type State = {
  settleButtonSubmitted: boolean,
};

const FooterWrapper = styled.View`
  flex-direction: column;
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

/*
const TextButton = styled.TouchableOpacity`
  padding: 10px;
  margin-top: 10px;
`;

const ButtonText = styled(MediumText)`
  font-size: ${fontSizes.big}px;
  letter-spacing: 0.1;
  color: #c95c45;
`;
*/

class SettleBalanceConfirm extends React.Component<Props, State> {
  txToSettle: TxToSettle[] = [];
  state = {
    settleButtonSubmitted: false,
  };

  constructor(props) {
    super(props);
    this.txToSettle = props.navigation.getParam('txToSettle', []);
  }

  componentDidMount() {
    const { estimateSettleBalance } = this.props;
    estimateSettleBalance(this.txToSettle);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.session.isOnline !== this.props.session.isOnline && this.props.session.isOnline) {
      const { estimateSettleBalance } = this.props;
      estimateSettleBalance(this.txToSettle);
    }
  }

  handleFormSubmit = async () => {
    const { navigation, settleTransactions, balances } = this.props;
    const txFeeInWei = this.getTxFeeInWei();

    const isEnoughForFee = checkIfEnoughForFee(balances, txFeeInWei.toString());
    if (!isEnoughForFee) {
      Toast.show({
        message: 'You need to deposit ETH to cover the withdrawal',
        type: 'warning',
        title: 'Balance Issue',
        autoClose: true,
      });
      return;
    }

    this.setState({ settleButtonSubmitted: true });
    await settleTransactions(this.txToSettle);
    this.setState({ settleButtonSubmitted: false }, () => navigation.dismiss());
  };

  getTxFeeInWei = (): BigNumber => {
    return get(this.props, 'settleTxFee.feeInfo.totalCost', 0);
  };

  render() {
    const { settleButtonSubmitted } = this.state;
    const { session, settleTxFee } = this.props;

    const feeInEth = formatAmount(utils.formatEther(this.getTxFeeInWei().toString()));
    let submitButtonTitle = 'Release Funds';
    if (!settleTxFee.isFetched) {
      submitButtonTitle = 'Getting the fee..';
    } else if (settleButtonSubmitted) {
      submitButtonTitle = 'Processing..';
    }

    const submitButtonDisabled = !session.isOnline
      || !settleTxFee.isFetched
      || settleButtonSubmitted;

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Review' }] }}
        keyboardAvoidFooter={(
          <FooterWrapper>
            <Button
              disabled={submitButtonDisabled}
              onPress={this.handleFormSubmit}
              title={submitButtonTitle}
            />
            {/* <TextButton onPress={() => {}}>
              <ButtonText>Open dispute</ButtonText>
            </TextButton> */}
          </FooterWrapper>
        )}
      >
        <ScrollWrapper
          regularPadding
          contentContainerStyle={{ marginTop: 40 }}
        >
          <LabeledRow>
            <Label>Assets to settle</Label>
            {this.txToSettle.map((asset: Object, index: number) =>
              <Value key={index}>{`${formatAmount(asset.value.toNumber())} ${asset.symbol}`}</Value>)
            }
          </LabeledRow>
          <LabeledRow>
            <Label>Transaction fee</Label>
            {settleTxFee.isFetched && <Value>{`${feeInEth} ETH`}</Value>}
            {!settleTxFee.isFetched && <Spinner style={{ marginTop: 5 }} width={20} height={20} />}
          </LabeledRow>
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  paymentNetwork: { settleTxFee },
}) => ({
  session,
  settleTxFee,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  settleTransactions: (transactions) => dispatch(settleTransactionsAction(transactions)),
  estimateSettleBalance: (transactions) => dispatch(estimateSettleBalanceAction(transactions)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SettleBalanceConfirm);
