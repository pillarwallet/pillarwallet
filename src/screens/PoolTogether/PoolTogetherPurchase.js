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
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import type { NavigationScreenProp } from 'react-navigation';
import isEmpty from 'lodash.isempty';
import t from 'translations/translate';

// actions
import { logScreenViewAction } from 'actions/analyticsActions';
import { fetchPoolPrizeInfo } from 'actions/poolTogetherActions';
import { estimateTransactionsAction, resetEstimateTransactionAction } from 'actions/transactionEstimateActions';

// constants
import { DAI, ETH } from 'constants/assetsConstants';
import { POOLTOGETHER_PURCHASE_CONFIRM } from 'constants/navigationConstants';

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

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { accountAssetsSelector } from 'selectors/assets';
import { activeAccountAddressSelector } from 'selectors';

// utils
import { themedColors } from 'utils/themes';
import { fontStyles } from 'utils/variables';
import { formatAmount } from 'utils/common';
import { getWinChance } from 'utils/poolTogether';
import { isEnoughBalanceForTransactionFee, getAssetData, getAssetsAsList } from 'utils/assets';

// services
import { getPurchaseTicketTransactions } from 'services/poolTogether';

// types
import type { TransactionDraft, TransactionFeeInfo } from 'models/Transaction';


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
  logScreenView: (view: string, screen: string) => void,
  fetchPoolStats: (symbol: string) => void,
  assets: Assets,
  supportedAssets: Asset[],
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  estimateErrorMessage: ?string,
  estimateTransactions: (transactionDrafts: TransactionDraft[]) => void,
  resetEstimateTransactions: () => void,
  accountAddress: string,
};

type State = {
  poolToken: string,
  tokenValue: string,
  numberOfTickets: number,
  userTickets: number,
  totalPoolTicketsCount: number,
  purchasePayload: Object,
  isInputValid: boolean,
};

class PoolTogetherPurchase extends React.Component<Props, State> {
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
      numberOfTickets: poolTicketsCount,
      userTickets,
      totalPoolTicketsCount,
      purchasePayload: null,
      isInputValid: false,
    };
  }

  componentDidMount() {
    const { logScreenView, resetEstimateTransactions } = this.props;
    resetEstimateTransactions();
    this.updatePurchaseFeeAndTransaction();
    logScreenView('View PoolTogether Purchase', 'PoolTogetherPurchase');
  }

  updatePurchaseFeeAndTransaction = async () => {
    const { poolToken, numberOfTickets } = this.state;
    const { estimateTransactions, accountAddress } = this.props;
    const purchasePayload = await getPurchaseTicketTransactions(accountAddress, numberOfTickets, poolToken);

    const transactionDrafts = purchasePayload.map(
      ({ to, amount: value, data }) => ({ to, value, data }),
    );

    estimateTransactions(transactionDrafts);
    this.setState({ purchasePayload });
  }

  onValueChange = (value) => {
    const numberOfTickets = Math.floor(parseFloat(value)) || 0;
    this.setState({
      tokenValue: value,
      numberOfTickets,
    }, () => {
      if (numberOfTickets > 0) {
        this.updatePurchaseFeeAndTransaction();
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
      isEstimating,
      feeInfo,
      estimateErrorMessage,
    } = this.props;

    const {
      poolToken,
      tokenValue,
      numberOfTickets,
      userTickets,
      totalPoolTicketsCount,
      purchasePayload,
      isInputValid,
    } = this.state;

    let errorMessage = estimateErrorMessage;

    const winChance = getWinChance(numberOfTickets + userTickets, totalPoolTicketsCount);

    if (feeInfo && purchasePayload && !isEnoughBalanceForTransactionFee(balances, {
      ...purchasePayload,
      txFeeInWei: feeInfo.fee,
      gasToken: feeInfo.gasToken,
    })) {
      errorMessage = t('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH });
    }

    const submitDisabled = isEstimating
      || !isInputValid
      || numberOfTickets === 0
      || !!errorMessage
      || !feeInfo;

    let nextNavigationFunction;
    if (purchasePayload) {
      nextNavigationFunction = () => {
        navigation.navigate(POOLTOGETHER_PURCHASE_CONFIRM,
          {
            poolToken,
            tokenValue: numberOfTickets,
            totalPoolTicketsCount,
            userTickets,
          });
      };
    }

    const poolTokenItem = getAssetData(getAssetsAsList(assets), supportedAssets, poolToken);
    const assetOptions = !isEmpty(poolTokenItem) ? [poolTokenItem] : [];
    const purchaseTransactionAvailable = !!purchasePayload;

    return (
      <ContainerWithHeader
        inset={{ bottom: 'never' }}
        headerProps={{ centerItems: [{ title: t('poolTogetherContent.title.ticketPurchaseScreen') }] }}
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
            <ContentRow style={{ paddingLeft: 40, paddingRight: 40 }}>
              <ValueInput
                value={tokenValue}
                onValueChange={this.onValueChange}
                assetData={poolTokenItem}
                customAssets={assetOptions}
                onFormValid={(isValid) => this.setState({ isInputValid: isValid })}
              />
            </ContentRow>
            <ContentRow>
              <Text label>
                {t('poolTogetherContent.label.winningChance', {
                  primaryText: t('percentValue', { value: formatAmount(winChance, 6) }),
                })}
              </Text>
            </ContentRow>
            {!!purchaseTransactionAvailable && !!feeInfo && (
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
            {!!purchaseTransactionAvailable && !!errorMessage && (
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
  accountAddress: activeAccountAddressSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  fetchPoolStats: (symbol: string) => dispatch(fetchPoolPrizeInfo(symbol)),
  estimateTransactions: (
    transactionDrafts: TransactionDraft[],
  ) => dispatch(estimateTransactionsAction(transactionDrafts)),
  resetEstimateTransactions: () => dispatch(resetEstimateTransactionAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(PoolTogetherPurchase);
