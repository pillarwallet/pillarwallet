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
import isEqual from 'lodash.isequal';

// actions
import { fetchGasInfoAction } from 'actions/historyActions';

// components
import { Footer, ScrollWrapper } from 'components/Layout';
import { Label, Paragraph, MediumText } from 'components/Typography';
import Button from 'components/Button';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import TextInput from 'components/TextInput';
import Spinner from 'components/Spinner';

// utils
import { spacing, fontSizes, fontStyles } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import { getUserName } from 'utils/contacts';
import { isEnoughBalanceForTransactionFee, getAssetDataByAddress, getAssetsAsList } from 'utils/assets';
import { images } from 'utils/images';
import { formatTransactionFee } from 'utils/common';
import { buildTxFeeInfo } from 'utils/smartWallet';
import { findFirstSmartAccount } from 'utils/accounts';

// services
import smartWalletService from 'services/smartWallet';
import { calculateGasEstimate } from 'services/assets';

// constants
import { ETH } from 'constants/assetsConstants';

// types
import type { Asset, Assets, Balances } from 'models/Asset';
import type { NavigationScreenProp } from 'react-navigation';
import type { CallRequest } from 'models/WalletConnect';
import type { Theme } from 'models/Theme';
import type { GasInfo } from 'models/GasInfo';
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
  session: Object,
  contacts: Object[],
  balances: Balances,
  theme: Theme,
  note: ?string,
  handleNoteChange: (text: string) => void,
  getTransactionDetails: (request: ?CallRequest) => Object,
  getTransactionPayload: (estimate: Object, request: ?CallRequest) => TokenTransactionPayload,
  isUnsupportedTransaction: (transaction: Object) => boolean,
  gasInfo: GasInfo,
  fetchGasInfo: () => void,
  rejectWCRequest: (request: CallRequest) => void,
  acceptWCRequest: (request: CallRequest, transactionPayload: ?TokenTransactionPayload) => void,
  accountAssets: Assets,
  supportedAssets: Asset[],
  useGasToken: boolean,
};

type State = {
  txFeeInfo: ?TransactionFeeInfo,
  gasLimit: number,
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
    gasLimit: 0,
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
    this.props.fetchGasInfo();
  }

  componentDidUpdate(prevProps: Props) {
    const {
      session: { isOnline },
      gasInfo,
      fetchGasInfo,
    } = this.props;
    if (prevProps.session.isOnline !== isOnline) {
      fetchGasInfo();
    }
    if (!isEqual(prevProps.gasInfo, gasInfo)) {
      this.fetchTransactionEstimate();
    }
  }

  fetchTransactionEstimate = async () => {
    if (this.unsupportedTransaction) return;
    this.setState({ gettingFee: true });

    const gasLimit = await this.getGasLimit();
    this.setState({ gasLimit: gasLimit || 0 }, async () => {
      const txFeeInfo = await this.getSmartWalletTxFee();
      this.setState({ txFeeInfo, gettingFee: false });
    });
  };

  getGasPriceWei = () => {
    const useRequestPrice = this.shouldUseGasInfoFromRequest();
    if (!useRequestPrice) {
      const avgGasPrice = this.props.gasInfo.gasPrice.avg || 0;
      return utils.parseUnits(avgGasPrice.toString(), 'gwei');
    }
    const gasPriceFromRequestHex = this.getGasPriceFromRequest();
    return utils.bigNumberify(gasPriceFromRequestHex);
  };

  getGasLimit = () => {
    if (this.shouldCalculateGasLimit()) {
      return this.getCalculatedGasLimit();
    }
    return this.getGasLimitFromRequest();
  };

  getCalculatedGasLimit = async () => {
    const { accounts } = this.props;
    const account = findFirstSmartAccount(accounts);
    if (!account) return null;
    const address = account.id;
    const gasLimit = await calculateGasEstimate({ ...this.transactionDetails, from: address });
    return gasLimit;
  }

  getRequestParams = () => get(this, 'request.params') || [];

  getGasLimitFromRequest = () => {
    const params = this.getRequestParams();
    let requestGasLimit = params[0]?.gas;
    if (!requestGasLimit && requestGasLimit !== 0) {
      requestGasLimit = params[0]?.gasLimit;
    }
    if (!requestGasLimit) return 0;
    return utils.bigNumberify(requestGasLimit).toNumber();
  };

  shouldUseGasInfoFromRequest = () => {
    const params = this.getRequestParams();
    if (!params.length || !params[0]?.gasPrice) return false;
    return true;
  };

  shouldCalculateGasLimit = () => {
    const shouldUseGasInfoFromRequest = this.shouldUseGasInfoFromRequest();
    if (!shouldUseGasInfoFromRequest) return true;
    const params = this.getRequestParams();
    return !params[0]?.gas && !params[0]?.gasLimit;
  }

  getGasPriceFromRequest = () => {
    const params = this.getRequestParams();
    return params[0]?.gasPrice;
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

    if (this.shouldUseGasInfoFromRequest()) {
      const gasPrice = this.getGasPriceFromRequest();
      const { gasLimit } = this.state;
      return { fee: utils.bigNumberify(gasPrice).mul(gasLimit) };
    }

    const estimated = await smartWalletService
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
      contacts,
      balances,
      session,
      theme,
      getTransactionPayload,
      note,
      handleNoteChange,
    } = this.props;

    const { txFeeInfo, gasLimit, gettingFee } = this.state;

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

        const gasPrice = this.getGasPriceWei();
        const estimatePart = {
          txFeeInWei,
          gasLimit,
          gasPrice,
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
          const txFeeInWeiBN = utils.bigNumberify(txFeeInWei.toString()); // BN compatibility
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

        const contact = contacts.find(({ ethAddress }) => to.toUpperCase() === ethAddress.toUpperCase());
        const recipientUsername = getUserName(contact);
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
            {!!recipientUsername && (
              <LabeledRow>
                <Label>Recipient Username</Label>
                <Value>{recipientUsername}</Value>
              </LabeledRow>
            )}
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
            {session.isOnline && !!recipientUsername &&
              <TextInput
                inputProps={{
                  onChange: text => handleNoteChange(text),
                  value: note,
                  autoCapitalize: 'none',
                  multiline: true,
                  numberOfLines: 3,
                  placeholder: 'Add a note to this transaction',
                }}
                keyboardAvoidance
              />
            }
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
  contacts: { data: contacts },
  session: { data: session },
  history: { gasInfo },
  assets: { supportedAssets },
  accounts: { data: accounts },
}) => ({
  accounts,
  contacts,
  session,
  gasInfo,
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

const mapDispatchToProps = dispatch => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
});

export default withWCRequests(
  withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(WalletConnectCallRequestScreen)),
);
