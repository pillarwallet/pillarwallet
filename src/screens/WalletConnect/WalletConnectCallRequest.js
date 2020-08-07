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
import { utils, BigNumber as EthersBigNumber } from 'ethers';
import { CachedImage } from 'react-native-cached-image';
import { createStructuredSelector } from 'reselect';
import { BigNumber } from 'bignumber.js';
import get from 'lodash.get';

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
import { buildTxFeeInfo } from 'utils/smartWallet';

// services
import smartWalletService from 'services/smartWallet';

// constants
import { ETH } from 'constants/assetsConstants';

// types
import type { Asset, Assets, Balances } from 'models/Asset';
import type { NavigationScreenProp } from 'react-navigation';
import type { CallRequest } from 'models/WalletConnect';
import type { Theme } from 'models/Theme';
import type { TokenTransactionPayload, TransactionFeeInfo } from 'models/Transaction';
import type { Account } from 'models/Account';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { accountAssetsSelector } from 'selectors/assets';
import { useGasTokenSelector } from 'selectors/smartWallet';

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
  useGasToken: boolean,
};

type State = {
  txFeeInfo: ?TransactionFeeInfo,
  gettingFee: boolean,
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
  margin-top: 14px;
  flex-grow: 1;
`;


class WalletConnectCallRequestScreen extends React.Component<Props, State> {
  request: ?CallRequest = null;
  transactionDetails: Object;
  unsupportedTransaction: boolean;

  state = {
    txFeeInfo: null,
    gettingFee: false,
  };

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
    if (['eth_sendTransaction', 'eth_signTransaction'].includes(requestMethod)) {
      this.fetchTransactionEstimate();
    }
  }

  fetchTransactionEstimate = async () => {
    if (this.unsupportedTransaction) return;
    this.setState({ gettingFee: true });

    const txFeeInfo = await this.getSmartWalletTxFee();
    this.setState({ txFeeInfo, gettingFee: false });
  };

  getSmartWalletTxFee = async (): Promise<TransactionFeeInfo> => {
    const { accountAssets, supportedAssets, useGasToken } = this.props;
    const defaultResponse = { fee: new BigNumber(0) };
    const {
      amount,
      to: recipient,
      contractAddress,
      data,
    } = this.transactionDetails;

    const value = Number(amount || 0);

    const { symbol, decimals } =
      getAssetDataByAddress(getAssetsAsList(accountAssets), supportedAssets, contractAddress);
    const assetData = { contractAddress, token: symbol, decimals };

    const transaction = {
      recipient,
      value,
      data,
    };

    const estimated = await smartWalletService()
      .estimateAccountTransaction(transaction, assetData)
      .then(result => buildTxFeeInfo(result, useGasToken))
      .catch(() => null);

    if (!estimated) {
      return defaultResponse;
    }

    return estimated;
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
    navigation.goBack();
  };

  render() {
    const {
      balances,
      theme,
      getTransactionPayload,
    } = this.props;

    const { txFeeInfo, gettingFee } = this.state;

    const colors = getThemeColors(theme);

    const { request } = this;
    const {
      icon,
      name,
      method,
      params = [],
    } = request || {};

    let type = 'Call';
    let body = null;
    let address = '';
    let message = '';
    let errorMessage;
    let transactionPayload;

    const gasToken = txFeeInfo?.gasToken || null;
    const txFeeInWei = txFeeInfo?.fee || new BigNumber(0);

    switch (method) {
      case 'eth_sendTransaction':
      case 'eth_signTransaction':
        type = 'Transaction';

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
          errorMessage = 'This data transaction or token is not supported in Pillar Wallet yet';
        } else {
          const txFeeInWeiBN = EthersBigNumber.from(txFeeInWei.toString()); // BN compatibility
          if (!isEnoughBalanceForTransactionFee(balances, {
            amount,
            symbol,
            decimals,
            txFeeInWei,
            gasToken,
          })) {
            const feeSymbol = get(txFeeInfo?.gasToken, 'symbol', ETH);
            errorMessage = `Not enough ${feeSymbol} for transaction fee`;
          }
          if (!gettingFee && txFeeInWeiBN.eq(0)) {
            errorMessage = 'Unable to calculate transaction fee';
          }
        }

        const feeDisplayValue = formatTransactionFee(txFeeInWei, gasToken);

        const { genericToken } = images(theme);

        body = (
          <ScrollWrapper regularPadding>
            <LabeledRow>
              <Label>Request From</Label>
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
                <Label>Amount</Label>
                <Value>{amount} {symbol}</Value>
              </LabeledRow>
            }
            <LabeledRow>
              <Label>Recipient Address</Label>
              <Value>{to}</Value>
            </LabeledRow>
            {!this.unsupportedTransaction &&
              <LabeledRow>
                <Label>Est. Network Fee</Label>
                <LabelSub>
                  Note: a fee below might be shown as higher than provided on the connected platform,
                  however, normally it will be less
                </LabelSub>
                {!!gettingFee && <Spinner style={{ marginTop: 5 }} width={20} height={20} />}
                {!gettingFee && <Value>{feeDisplayValue}</Value>}
              </LabeledRow>
            }
            {data.toLowerCase() !== '0x' && (
              <LabeledRow>
                <Label>Data</Label>
                <Value>{data}</Value>
              </LabeledRow>
            )}
          </ScrollWrapper>
        );
        break;
      case 'eth_sign':
        type = 'Message';

        address = params[0]; // eslint-disable-line
        message = params[1]; // eslint-disable-line
        body = (
          <ScrollWrapper regularPadding>
            <LabeledRow>
              <Label>Address</Label>
              <Value>{address}</Value>
            </LabeledRow>
            <LabeledRow>
              <Label>Message</Label>
              <Value>{message}</Value>
            </LabeledRow>
          </ScrollWrapper>
        );
        break;
      case 'personal_sign':
        type = 'Message';

        address = params[1]; // eslint-disable-line
        try {
          message = utils.toUtf8String(params[0]);
        } catch (e) {
          ([message] = params);
        }
        body = (
          <ScrollWrapper regularPadding>
            <LabeledRow>
              <Label>Address</Label>
              <Value>{address}</Value>
            </LabeledRow>
            <LabeledRow>
              <Label>Message</Label>
              <Value>{message}</Value>
            </LabeledRow>
          </ScrollWrapper>
        );
        break;
      default:
        type = 'Unsupported';
        errorMessage = 'We are sorry, but we do not support this action yet.';
        break;
    }

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: `${type} Request` }],
        }}
      >
        {body}
        <Footer keyboardVerticalOffset={40} backgroundColor={colors.surface}>
          {!!errorMessage && <WarningMessage small>{errorMessage}</WarningMessage>}
          <FooterWrapper>
            <OptionButton
              primaryInverted
              onPress={() => this.handleFormSubmit(this.request, transactionPayload)}
              disabled={!!errorMessage || (type === 'Transaction' && gettingFee)}
              regularText
              title={`Approve ${type}`}
            />
            <OptionButton
              dangerInverted
              onPress={this.handleDismissal}
              regularText
              title="Reject"
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
}) => ({
  accounts,
  supportedAssets,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  accountAssets: accountAssetsSelector,
  useGasToken: useGasTokenSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default withWCRequests(
  withTheme(connect(combinedMapStateToProps)(WalletConnectCallRequestScreen)),
);
