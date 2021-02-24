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
import { RefreshControl, Platform } from 'react-native';
import { connect } from 'react-redux';
import styled, { withTheme } from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import type { NavigationScreenProp } from 'react-navigation';
import isEmpty from 'lodash.isempty';
import t from 'translations/translate';

// actions
import { fetchPoolPrizeInfo } from 'actions/poolTogetherActions';
import { estimateTransactionAction, resetEstimateTransactionAction } from 'actions/transactionEstimateActions';

// constants
import { DAI, ETH } from 'constants/assetsConstants';
import { POOLTOGETHER_WITHDRAW_CONFIRM } from 'constants/navigationConstants';

// components
import { ScrollWrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import ValueInput from 'components/ValueInput';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import FeeLabelToggle from 'components/FeeLabelToggle';

// models
import type { Accounts } from 'models/Account';
import type { Balances, Assets, Asset } from 'models/Asset';
import type { PoolPrizeInfo } from 'models/PoolTogether';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { accountAssetsSelector } from 'selectors/assets';

// utils
import { themedColors } from 'utils/themes';
import { fontStyles } from 'utils/variables';
import { isEnoughBalanceForTransactionFee, getAssetData, getAssetsAsList } from 'utils/assets';

// services
import { getWithdrawTicketTransaction } from 'services/poolTogether';

// types
import type { TransactionFeeInfo } from 'models/Transaction';


const ContentWrapper = styled.View`
  padding-top: ${Platform.select({
    ios: '25px',
    android: '19px',
  })};
`;

const Text = styled(BaseText)`
  ${({ label }) => label ? fontStyles.regular : fontStyles.large};
  letter-spacing: 0.18px;
  color: ${({ label }) => label ? themedColors.secondaryText : themedColors.text};
`;

const ContentRow = styled.View`
  flex-direction: row;
  justify-content: center;
  padding: 8px 20px 8px 20px;
`;

type Props = {
  name: string,
  navigation: NavigationScreenProp<*>,
  session: Object,
  smartWallet: Object,
  accounts: Accounts,
  balances: Balances,
  poolPrizeInfo: PoolPrizeInfo,
  fetchPoolStats: (symbol: string) => void,
  theme: Theme,
  assets: Assets,
  supportedAssets: Asset[],
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  estimateErrorMessage: ?string,
  estimateTransaction: (
    receiver: string,
    amount: number,
    data: string,
  ) => void,
  resetEstimateTransaction: () => void,
};

type State = {
  poolToken: string,
  tokenValue: string,
  ticketsCount: number,
  userTickets: number,
  totalPoolTicketsCount: number,
  withdrawPayload: Object,
  isInputValid: boolean,
};

class PoolTogetherWithdraw extends React.Component<Props, State> {
  scroll: Object;

  constructor(props) {
    const { navigation } = props;
    const {
      poolToken = DAI,
      poolTicketsCount = 0,
      userTickets = 0,
      totalPoolTicketsCount = 0,
    } = navigation.state.params || {};
    super(props);
    this.state = {
      poolToken,
      tokenValue: poolTicketsCount.toString(),
      ticketsCount: poolTicketsCount,
      userTickets,
      totalPoolTicketsCount,
      withdrawPayload: null,
      isInputValid: false,
    };
  }

  componentDidMount() {
    const { resetEstimateTransaction } = this.props;
    resetEstimateTransaction();
    this.updateWithdrawFeeAndTransaction();
  }

  updateWithdrawFeeAndTransaction = () => {
    const { poolToken, ticketsCount } = this.state;
    const { estimateTransaction } = this.props;
    const withdrawPayload = getWithdrawTicketTransaction(ticketsCount, poolToken);
    const { to, data, amount } = withdrawPayload;
    estimateTransaction(to, amount, data);
    this.setState({ withdrawPayload });
  }

  onValueChange = (value) => {
    const ticketsCount = Math.floor(parseFloat(value)) || 0;
    this.setState({
      tokenValue: value,
      ticketsCount,
    }, () => {
      if (ticketsCount > 0) {
        this.updateWithdrawFeeAndTransaction();
      }
    });
  }

  render() {
    const {
      navigation,
      fetchPoolStats,
      balances,
      assets,
      supportedAssets,
      feeInfo,
      isEstimating,
      estimateErrorMessage,
    } = this.props;

    const {
      poolToken,
      tokenValue,
      ticketsCount,
      userTickets,
      totalPoolTicketsCount,
      withdrawPayload,
      isInputValid,
    } = this.state;

    let errorMessage = estimateErrorMessage;

    if (feeInfo && withdrawPayload && !isEnoughBalanceForTransactionFee(balances, {
      ...withdrawPayload,
      txFeeInWei: feeInfo.fee,
      gasToken: feeInfo.gasToken,
    })) {
      errorMessage = t('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH });
    }

    const submitDisabled = isEstimating
      || !isInputValid
      || ticketsCount === 0
      || !!errorMessage
      || !feeInfo;

    let nextNavigationFunction;
    if (withdrawPayload) {
      nextNavigationFunction = () => {
        navigation.navigate(POOLTOGETHER_WITHDRAW_CONFIRM,
          {
            poolToken,
            tokenValue: ticketsCount,
            totalPoolTicketsCount,
            userTickets,
            transactionPayload: withdrawPayload,
          });
      };
    }

    const poolTokenItem = getAssetData(getAssetsAsList(assets), supportedAssets, poolToken);
    const assetOptions = !isEmpty(poolTokenItem) ? [poolTokenItem] : [];

    const balanceOptions = {
      [poolToken]: {
        symbol: poolToken,
        balance: userTickets.toString(),
      },
    };

    const withdrawTransactionAvailable = !!withdrawPayload;

    return (
      <ContainerWithHeader
        inset={{ bottom: 'never' }}
        headerProps={{ centerItems: [{ title: t('poolTogetherContent.title.withdrawScreen') }] }}
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
          keyboardShouldPersistTaps="always"
        >
          <ContentWrapper>
            <ContentRow style={{ paddingLeft: 40, paddingRight: 40, zIndex: 10 }}>
              <ValueInput
                value={tokenValue}
                onValueChange={this.onValueChange}
                assetData={poolTokenItem}
                customAssets={assetOptions}
                customBalances={balanceOptions}
                onFormValid={(isValid) => this.setState({ isInputValid: isValid })}
              />
            </ContentRow>
            <ContentRow>
              <Text label center>{t('poolTogetherContent.paragraph.withdrawalNote')}</Text>
            </ContentRow>
            {!!withdrawTransactionAvailable && !!feeInfo && (
              <ContentRow>
                <FeeLabelToggle
                  labelText={t('label.fee')}
                  txFeeInWei={feeInfo?.fee}
                  isLoading={isEstimating}
                  gasToken={feeInfo?.gasToken}
                  hasError={!!errorMessage}
                  showFiatDefault
                />
              </ContentRow>
            )}
            {!!withdrawTransactionAvailable && !!errorMessage && (
              <ContentRow>
                <BaseText negative>{errorMessage}</BaseText>
              </ContentRow>
            )}
            <ContentRow>
              <Button
                title={t('button.next')}
                onPress={() => {
                  if (submitDisabled) return null;
                  return nextNavigationFunction && nextNavigationFunction();
                }}
                disabled={!!submitDisabled}
                style={{ marginBottom: 13 }}
              />
            </ContentRow>
          </ContentWrapper>
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  accounts: { data: accounts },
  poolTogether: {
    poolStats: poolPrizeInfo,
  },
  assets: { supportedAssets },
  transactionEstimate: { isEstimating, feeInfo, errorMessage: estimateErrorMessage },
}: RootReducerState): $Shape<Props> => ({
  session,
  accounts,
  poolPrizeInfo,
  supportedAssets,
  isEstimating,
  feeInfo,
  estimateErrorMessage,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchPoolStats: (symbol: string) => dispatch(fetchPoolPrizeInfo(symbol)),
  estimateTransaction: (
    receiver: string,
    amount: number,
    data: string,
  ) => dispatch(estimateTransactionAction(receiver, amount, data)),
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(withTheme(PoolTogetherWithdraw));
