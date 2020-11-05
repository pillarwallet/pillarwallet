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
import isEqual from 'lodash.isequal';

// actions
import { logScreenViewAction } from 'actions/analyticsActions';
import {
  fetchPoolPrizeInfo,
  setDismissApproveAction,
  fetchPoolAllowanceStatusAction,
} from 'actions/poolTogetherActions';
import { estimateTransactionAction, resetEstimateTransactionAction } from 'actions/transactionEstimateActions';

// constants
import { DAI, ETH } from 'constants/assetsConstants';
import { SEND_TOKEN_PIN_CONFIRM, POOLTOGETHER_PURCHASE_CONFIRM } from 'constants/navigationConstants';
import { POOL_TOGETHER_ALLOW } from 'constants/poolTogetherConstants';

// components
import { ScrollWrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import ValueInput from 'components/ValueInput';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import Toast from 'components/Toast';
import FeeLabelToggle from 'components/FeeLabelToggle';
import Modal from 'components/Modal';

// models
import type { Accounts } from 'models/Account';
import type { Balances, Assets, Asset } from 'models/Asset';
import type { PoolPrizeInfo } from 'models/PoolTogether';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { accountAssetsSelector } from 'selectors/assets';

// utils
import { themedColors } from 'utils/themes';
import { fontStyles } from 'utils/variables';
import { formatAmount } from 'utils/common';
import { getWinChance } from 'utils/poolTogether';
import { isEnoughBalanceForTransactionFee, getAssetData, getAssetsAsList } from 'utils/assets';

// services
import { getApproveTransaction, getPurchaseTicketTransaction } from 'services/poolTogether';

// types
import type { TransactionFeeInfo } from 'models/Transaction';

// local components
import PoolTokenAllowModal from './PoolTokenAllowModal';


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
  fetchPoolAllowanceStatus: (symbol: string) => void,
  setDismissApprove: (symbol: string) => void,
  poolAllowance: { [string]: boolean },
  poolApproveExecuting: { [string]: boolean | string },
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
  numberOfTickets: number,
  userTickets: number,
  totalPoolTicketsCount: number,
  allowPayload: Object,
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
      allowPayload: null,
      purchasePayload: null,
      isInputValid: false,
    };
  }

  componentDidMount() {
    const { logScreenView, resetEstimateTransaction } = this.props;
    resetEstimateTransaction();
    // check if poolTogether is already allowed and get fee if not
    this.updateAllowanceFeeAndTransaction();
    this.updatePurchaseFeeAndTransaction();
    logScreenView('View PoolTogether Purchase', 'PoolTogetherPurchase');
  }

  componentDidUpdate(prevProps: Props) {
    if (!isEqual(this.props.poolAllowance, prevProps.poolAllowance)) {
      this.updatePurchaseFeeAndTransaction();
    }
  }

  updateAllowanceFeeAndTransaction = () => {
    const { poolToken } = this.state;
    const { poolAllowance, estimateTransaction } = this.props;
    const hasAllowance = poolAllowance[poolToken];
    if (!hasAllowance) {
      const allowPayload = getApproveTransaction(poolToken);
      const { to, data, amount } = allowPayload;
      estimateTransaction(to, amount, data);
      this.setState({ allowPayload });
    }
  }

  updatePurchaseFeeAndTransaction = () => {
    const { poolToken, numberOfTickets } = this.state;
    const { poolAllowance, estimateTransaction } = this.props;
    if (poolAllowance[poolToken]) {
      const purchasePayload = getPurchaseTicketTransaction(numberOfTickets, poolToken);
      const { to, data, amount } = purchasePayload;
      estimateTransaction(to, amount, data);
      this.setState({ purchasePayload });
    }
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

  openAllowAssetModal = () => {
    const { poolToken, allowPayload } = this.state;
    const { estimateTransaction, resetEstimateTransaction } = this.props;
    resetEstimateTransaction();
    const { to, data, amount } = allowPayload;
    estimateTransaction(to, amount, data);
    Modal.open(() => (
      <PoolTokenAllowModal
        assetSymbol={poolToken}
        transactionPayload={allowPayload}
        onModalHide={() => {
          const { setDismissApprove } = this.props;
          setDismissApprove(poolToken);
        }}
        onAllow={this.allowPoolAsset}
      />
    ));
  }

  allowPoolAsset = () => {
    const { navigation, feeInfo } = this.props;
    const { allowPayload } = this.state;

    if (!feeInfo) {
      Toast.show({
        message: t('toast.cannotAllowAsset'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
      return;
    }

    const { fee: txFeeInWei, gasToken } = feeInfo;

    const transactionPayload = {
      ...allowPayload,
      txFeeInWei,
      gasToken,
    };

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      transactionType: POOL_TOGETHER_ALLOW,
    });
  };

  render() {
    const {
      navigation,
      fetchPoolStats,
      balances,
      poolAllowance,
      poolApproveExecuting,
      fetchPoolAllowanceStatus,
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

    const hasAllowance = poolAllowance[poolToken];

    const winChance = getWinChance(numberOfTickets + userTickets, totalPoolTicketsCount);

    const isApprovalExecuting = !!poolApproveExecuting[poolToken];

    if (feeInfo && purchasePayload && hasAllowance && !isEnoughBalanceForTransactionFee(balances, {
      ...purchasePayload,
      txFeeInWei: feeInfo.fee,
      gasToken: feeInfo.gasToken,
    })) {
      errorMessage = t('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH });
    }

    const submitDisabled = isEstimating
      || isApprovalExecuting
      || !isInputValid
      || (hasAllowance && (numberOfTickets === 0 || !!errorMessage || !feeInfo));

    let nextNavigationFunction;
    if (purchasePayload) {
      nextNavigationFunction = () => {
        navigation.navigate(POOLTOGETHER_PURCHASE_CONFIRM,
          {
            poolToken,
            tokenValue: numberOfTickets,
            totalPoolTicketsCount,
            userTickets,
            transactionPayload: purchasePayload,
          });
      };
    }

    const poolTokenItem = getAssetData(getAssetsAsList(assets), supportedAssets, poolToken);
    const assetOptions = !isEmpty(poolTokenItem) ? [poolTokenItem] : [];
    const purchaseTransactionAvailable = !!hasAllowance && !!purchasePayload;

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
                if (isApprovalExecuting) {
                  fetchPoolAllowanceStatus(poolToken);
                }
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
            <ContentRow>
              {!hasAllowance && !isEstimating && !isApprovalExecuting && (
                <Text center label>{t('poolTogetherContent.paragraph.automationMissing')}</Text>
              )}
              {!!isApprovalExecuting && (
                <Text center label>{t('poolTogetherContent.paragraph.pendingAutomation')}</Text>
              )}
              {isEstimating && !isApprovalExecuting && !feeInfo && (
                <Text center label>{t('label.fetchingFee')}</Text>
              )}
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

                  if (!hasAllowance && !isApprovalExecuting) {
                    this.openAllowAssetModal();
                  }

                  return nextNavigationFunction && nextNavigationFunction();
                }}
                disabled={!!submitDisabled}
                style={{ marginBottom: 13, width: '100%' }}
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
    poolAllowance,
    poolApproveExecuting,
  },
  assets: { supportedAssets },
  transactionEstimate: { isEstimating, feeInfo, errorMessage: estimateErrorMessage },
}: RootReducerState): $Shape<Props> => ({
  session,
  accounts,
  poolPrizeInfo,
  poolAllowance,
  poolApproveExecuting,
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
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  fetchPoolStats: (symbol: string) => dispatch(fetchPoolPrizeInfo(symbol)),
  fetchPoolAllowanceStatus: (symbol: string) => dispatch(fetchPoolAllowanceStatusAction(symbol)),
  setDismissApprove: (symbol: string) => dispatch(setDismissApproveAction(symbol)),
  estimateTransaction: (
    receiver: string,
    amount: number,
    data: string,
  ) => dispatch(estimateTransactionAction(receiver, amount, data)),
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(PoolTogetherPurchase);
