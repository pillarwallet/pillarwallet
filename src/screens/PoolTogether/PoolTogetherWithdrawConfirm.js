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
import { RefreshControl } from 'react-native';
import { connect } from 'react-redux';
import styled, { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// actions
import { logScreenViewAction } from 'actions/analyticsActions';
import { fetchPoolPrizeInfo } from 'actions/poolTogetherActions';

// constants
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { POOLTOGETHER_WITHDRAW_TRANSACTION } from 'constants/poolTogetherConstants';

// components
import { ScrollWrapper, Spacing } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import Table, { TableRow, TableLabel, TableAmount, TableTotal, TableFee } from 'components/Table';
import TokenReviewSummary from 'components/ReviewSummary/TokenReviewSummary';
import Toast from 'components/Toast';

// models
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';
import type { TransactionFeeInfo } from 'models/Transaction';

const ContentWrapper = styled.View`
  padding: 16px 20px;
`;

type Props = {
  name: string,
  navigation: NavigationScreenProp<*>,
  session: Object,
  logScreenView: (view: string, screen: string) => void,
  fetchPoolStats: (symbol: string) => void,
  theme: Theme,
  user: Object,
  feeInfo: ?TransactionFeeInfo,
};

type State = {
  poolToken: string,
  tokenValue: number,
  transactionPayload: Object,
};

class PoolTogetherWithdrawConfirm extends React.Component<Props, State> {
  scroll: Object;

  constructor(props) {
    const { navigation } = props;
    const {
      poolToken,
      tokenValue,
      transactionPayload,
    } = navigation.state.params || {};
    super(props);
    this.state = {
      poolToken,
      tokenValue,
      transactionPayload,
    };
  }

  componentDidMount() {
    const { logScreenView } = this.props;
    logScreenView('View PoolTogether Withdraw Confirm', 'PoolTogetherWithdrawConfirm');
  }

  withdrawPoolAsset = () => {
    const { navigation, feeInfo } = this.props;
    const { transactionPayload } = this.state;

    if (!feeInfo) {
      Toast.show({
        message: t('toast.cannotWithdraw'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
      return;
    }

    const { fee: txFeeInWei, gasToken } = feeInfo;

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload: { ...transactionPayload, txFeeInWei, gasToken },
      transactionType: POOLTOGETHER_WITHDRAW_TRANSACTION,
    });
  };

  render() {
    const { fetchPoolStats, feeInfo } = this.props;
    const { poolToken, tokenValue } = this.state;

    return (
      <ContainerWithHeader
        inset={{ bottom: 'never' }}
        headerProps={{ centerItems: [{ title: t('poolTogetherContent.title.withdrawConfirmScreen') }] }}
      >
        <ScrollWrapper
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                fetchPoolStats(poolToken);
              }}
            />
          }
          innerRef={ref => { this.scroll = ref; }}
        >
          <ContentWrapper>
            <TokenReviewSummary
              assetSymbol={poolToken}
              text={t('poolTogetherContent.label.youAreWithdrawing')}
              amount={tokenValue}
            />
            <Spacing h={42} />
            <Table>
              <TableRow>
                <TableLabel>{t('transactions.label.ethFee')}</TableLabel>
                <TableFee txFeeInWei={feeInfo?.fee} gasToken={feeInfo?.gasToken} />
              </TableRow>
              <TableRow>
                <TableLabel>{t('transactions.label.pillarFee')}</TableLabel>
                <TableAmount amount={0} />
              </TableRow>
              <TableRow>
                <TableTotal>{t('transactions.label.totalFee')}</TableTotal>
                <TableFee txFeeInWei={feeInfo?.fee} gasToken={feeInfo?.gasToken} />
              </TableRow>
            </Table>
            <Spacing h={50} />
            <Button
              title={t('poolTogetherContent.button.confirmWithdraw')}
              onPress={() => {
                this.withdrawPoolAsset();
              }}
              style={{ marginBottom: 13, width: '100%' }}
            />
          </ContentWrapper>
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  user: { data: user },
  transactionEstimate: { feeInfo },
}: RootReducerState): $Shape<Props> => ({
  session,
  user,
  feeInfo,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  fetchPoolStats: (symbol: string) => dispatch(fetchPoolPrizeInfo(symbol)),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(PoolTogetherWithdrawConfirm));
