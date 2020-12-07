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
import styled, { withTheme } from 'styled-components/native';
import { Keyboard } from 'react-native';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { CachedImage } from 'react-native-cached-image';
import { createStructuredSelector } from 'reselect';
import { BigNumber } from 'bignumber.js';
import get from 'lodash.get';
import t from 'translations/translate';

// actions
import { estimateTransactionAction, resetEstimateTransactionAction } from 'actions/transactionEstimateActions';

// components
import { Footer, ScrollWrapper } from 'components/Layout';
import { Label, Paragraph, MediumText } from 'components/Typography';
import Button from 'components/Button';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Spinner from 'components/Spinner';

// utils
import { spacing, fontSizes, fontStyles } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import { isEnoughBalanceForTransactionFee, getAssetDataByAddress, getAssetsAsList } from 'utils/assets';
import { images } from 'utils/images';
import { formatTransactionFee } from 'utils/common';

// constants
import { ETH } from 'constants/assetsConstants';
import { PERSONAL_SIGN, ETH_SEND_TX, ETH_SIGN_TX, REQUEST_TYPE } from 'constants/walletConnectConstants';

// types
import type { Asset, AssetData, Assets, Balances } from 'models/Asset';
import type { NavigationScreenProp } from 'react-navigation';
import type { CallRequest } from 'models/WalletConnect';
import type { Theme } from 'models/Theme';
import type { TokenTransactionPayload, TransactionFeeInfo } from 'models/Transaction';
import type { Account } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { accountAssetsSelector } from 'selectors/assets';

// local components
import withWCRequests from './withWCRequests';


type Props = {
  accounts: Account[],
  navigation: NavigationScreenProp<*>,
  requests: CallRequest[],
  balances: Balances,
  theme: Theme,
  getTransactionDetails: (request: ?CallRequest) => Object,
  getTransactionPayload: (estimate: Object, request: ?CallRequest) => TokenTransactionPayload,
  isUnsupportedTransaction: (transaction: Object) => boolean,
  rejectWCRequest: (request: CallRequest) => void,
  acceptWCRequest: (request: CallRequest, transactionPayload: ?TokenTransactionPayload) => void,
  accountAssets: Assets,
  supportedAssets: Asset[],
  estimateTransaction: (recipient: string, value: number, data: ?string, assetData: AssetData) => void,
  resetEstimateTransaction: () => void,
  isEstimating: boolean,
  feeInfo: ?TransactionFeeInfo,
  estimateErrorMessage: ?string,
};

const FooterWrapper = styled.View`
  flex-direction: column;
  width: 100%;
`;

const LabeledRow = styled.View`
  margin: 10px 0;
`;

const Value = styled(MediumText)`
  font-size: ${fontSizes.big}px;
`;

const LabelSub = styled(Label)`
  ${fontStyles.tiny};
`;

const WarningMessage = styled(Paragraph)`
  text-align: center;
  color: ${themedColors.negative};
  padding-bottom: ${spacing.rhythm}px;
`;

const OptionButton = styled(Button)`
  margin-top: 4px;
  flex-grow: 1;
`;

class WalletConnectCallRequestScreen extends React.Component<Props> {
  request: ?CallRequest = null;
  transactionDetails: Object;
  unsupportedTransaction: boolean;

  constructor(props: Props) {
    super(props);
    const {
      navigation,
      requests,
      getTransactionDetails,
      isUnsupportedTransaction,
    } = props;
    const requestCallId = +navigation.getParam('callId', 0);
    const request = requests.find(({ callId }) => callId === requestCallId);

    this.request = request;
    this.transactionDetails = getTransactionDetails(request);
    this.unsupportedTransaction = isUnsupportedTransaction(this.transactionDetails);
  }

  componentDidMount() {
    const requestMethod = get(this.request, 'method');
    this.props.resetEstimateTransaction();
    if ([ETH_SEND_TX, ETH_SIGN_TX].includes(requestMethod)) {
      this.fetchTransactionEstimate();
    }
  }

  fetchTransactionEstimate = () => {
    if (this.unsupportedTransaction) return;

    const { accountAssets, supportedAssets, estimateTransaction } = this.props;
    const {
      amount,
      to,
      contractAddress,
      data,
    } = this.transactionDetails;

    const value = Number(amount || 0);

    const { symbol, decimals } = getAssetDataByAddress(
      getAssetsAsList(accountAssets),
      supportedAssets,
      contractAddress,
    );

    const assetData = { contractAddress, token: symbol, decimals };

    estimateTransaction(to, value, data, assetData);
  };

  handleFormSubmit = (request, transactionPayload) => {
    Keyboard.dismiss();
    if (!request) return;
    this.props.acceptWCRequest(request, transactionPayload);
  };

  handleDismissal = () => {
    const { request } = this;
    const { navigation, rejectWCRequest } = this.props;

    if (request) {
      rejectWCRequest(request);
    }
    navigation.dismiss();
  };

  render() {
    const {
      balances,
      theme,
      getTransactionPayload,
      feeInfo,
      isEstimating,
      estimateErrorMessage,
    } = this.props;

    const colors = getThemeColors(theme);

    const { request } = this;
    const {
      icon,
      name,
      method,
      params = [],
    } = request || {};

    let type = REQUEST_TYPE.CALL;
    let body = null;
    let address = '';
    let message = '';
    let errorMessage = estimateErrorMessage;
    let transactionPayload;

    const gasToken = feeInfo?.gasToken || null;
    const txFeeInWei = feeInfo?.fee || new BigNumber(0);

    switch (method) {
      case ETH_SEND_TX:
      case ETH_SIGN_TX:
        type = REQUEST_TYPE.TRANSACTION;

        const estimatePart = {
          txFeeInWei,
          gasToken: {},
        };
        if (gasToken) estimatePart.gasToken = gasToken;
        transactionPayload = getTransactionPayload(estimatePart, request);

        const {
          to,
          data = '',
          amount,
          symbol,
          decimals,
        } = transactionPayload;

        if (this.unsupportedTransaction) {
          errorMessage = t('error.walletConnect.assetNotSupported');
        } else if (feeInfo && !isEnoughBalanceForTransactionFee(balances, {
          amount,
          symbol,
          decimals,
          txFeeInWei,
          gasToken,
        })) {
          errorMessage = t('error.notEnoughTokenForFee', { token: gasToken || ETH });
        }

        const feeDisplayValue = formatTransactionFee(txFeeInWei, gasToken);

        const { genericToken } = images(theme);

        body = (
          <ScrollWrapper regularPadding>
            <LabeledRow>
              <Label>{t('walletConnectContent.label.requestFrom')}</Label>
              <Value>{name}</Value>
            </LabeledRow>
            {!!icon && (
              <CachedImage
                key={name}
                style={{
                  height: 55,
                  width: 55,
                  marginBottom: spacing.mediumLarge,
                }}
                source={{ uri: icon }}
                fallbackSource={genericToken}
                resizeMode="contain"
              />
            )}
            {!this.unsupportedTransaction &&
              <LabeledRow>
                <Label>{t('transactions.label.amount')}</Label>
                <Value>{t('tokenValue', { value: amount, token: symbol })}</Value>
              </LabeledRow>
            }
            <LabeledRow>
              <Label>{t('transactions.label.recipientAddress')}</Label>
              <Value>{to}</Value>
            </LabeledRow>
            {!this.unsupportedTransaction &&
              <LabeledRow>
                <Label>{t('transactions.label.transactionFee')}</Label>
                <LabelSub>
                  {t('walletConnectContent.paragraph.finalFeeMightBeHigher')}
                </LabelSub>
                {!!isEstimating && <Spinner style={{ marginTop: 5 }} size={20} trackWidth={2} />}
                {!isEstimating && <Value>{feeDisplayValue}</Value>}
              </LabeledRow>
            }
            {data.toLowerCase() !== '0x' && (
              <LabeledRow>
                <Label>{t('transactions.label.data')}</Label>
                <Value>{data}</Value>
              </LabeledRow>
            )}
          </ScrollWrapper>
        );
        break;
      case 'eth_sign':
        type = REQUEST_TYPE.MESSAGE;

        address = params[0]; // eslint-disable-line
        message = params[1]; // eslint-disable-line
        body = (
          <ScrollWrapper regularPadding>
            <LabeledRow>
              <Label>{t('transactions.label.address')}</Label>
              <Value>{address}</Value>
            </LabeledRow>
            <LabeledRow>
              <Label>{t('transactions.label.message')}</Label>
              <Value>{message}</Value>
            </LabeledRow>
          </ScrollWrapper>
        );
        break;
      case PERSONAL_SIGN:
        type = REQUEST_TYPE.MESSAGE;

        address = params[1]; // eslint-disable-line
        try {
          message = utils.toUtf8String(params[0]);
        } catch (e) {
          ([message] = params);
        }
        body = (
          <ScrollWrapper regularPadding>
            <LabeledRow>
              <Label>{t('transactions.label.address')}</Label>
              <Value>{address}</Value>
            </LabeledRow>
            <LabeledRow>
              <Label>{t('transactions.label.message')}</Label>
              <Value>{message}</Value>
            </LabeledRow>
          </ScrollWrapper>
        );
        break;
      default:
        type = REQUEST_TYPE.UNSUPPORTED;
        errorMessage = t('error.walletConnect.unsupportedAction');
        break;
    }

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{
            title: t([
              `walletConnectContent.title.requestType.${type}`,
              'walletConnectContent.title.requestType.default',
            ]),
          }],
        }}
      >
        {body}
        <Footer keyboardVerticalOffset={40} backgroundColor={colors.basic070}>
          {!!errorMessage && <WarningMessage small>{errorMessage}</WarningMessage>}
          <FooterWrapper>
            <OptionButton
              onPress={() => this.handleFormSubmit(this.request, transactionPayload)}
              disabled={!!errorMessage || (type === REQUEST_TYPE.TRANSACTION && isEstimating)}
              title={
                t([
                  `walletConnectContent.button.approveType.${type}`,
                  'walletConnectContent.button.approveType.default',
                ])
              }
            />
            <OptionButton
              danger
              transparent
              onPress={this.handleDismissal}
              title={t('button.reject')}
            />
          </FooterWrapper>
        </Footer>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  assets: { supportedAssets },
  accounts: { data: accounts },
  transactionEstimate: { feeInfo, isEstimating, errorMessage: estimateErrorMessage },
}: RootReducerState): $Shape<Props> => ({
  accounts,
  supportedAssets,
  isEstimating,
  feeInfo,
  estimateErrorMessage,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  accountAssets: accountAssetsSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  estimateTransaction: (
    recipient: string,
    value: number,
    data: ?string,
    assetData: AssetData,
  ) => dispatch(estimateTransactionAction(recipient, value, data, assetData)),
  resetEstimateTransaction: () => dispatch(resetEstimateTransactionAction()),
});

export default withWCRequests(
  withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(WalletConnectCallRequestScreen)),
);
