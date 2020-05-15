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
import { GAS_TOKEN_ADDRESS } from 'react-native-dotenv';
import isEmpty from 'lodash.isempty';

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
import { checkIfSmartWalletAccount } from 'utils/accounts';
import { formatTransactionFee } from 'utils/common';

// services
import { calculateGasEstimate } from 'services/assets';
import smartWalletService from 'services/smartWallet';

// constants
import { ETH } from 'constants/assetsConstants';

// types
import type { Asset, Assets, Balances } from 'models/Asset';
import type { NavigationScreenProp } from 'react-navigation';
import type { CallRequest } from 'models/WalletConnect';
import type { Theme } from 'models/Theme';
import type { GasInfo } from 'models/GasInfo';
import type { GasToken, TokenTransactionPayload } from 'models/Transaction';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { activeAccountAddressSelector, activeAccountSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';

// types
import type { Account } from 'models/Account';

// local components
import withWCRequests from './withWCRequests';


type Props = {
  navigation: NavigationScreenProp<*>,
  requests: CallRequest[],
  session: Object,
  contacts: Object[],
  balances: Balances,
  activeAccountAddress: string,
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
  activeAccount: ?Account,
  accountAssets: Assets,
  supportedAssets: Asset[],
};

type State = {
  txFeeInWei: BigNumber,
  gasLimit: number,
  gettingFee: boolean,
  feeByGasToken: boolean,
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
  gasToken: ?GasToken;
  unsupportedTransaction: boolean;

  state = {
    txFeeInWei: new BigNumber(0),
    gasLimit: 0,
    gettingFee: false,
    feeByGasToken: false,
  };

  constructor(props: Props) {
    super(props);
    const {
      navigation,
      requests,
      getTransactionDetails,
      isUnsupportedTransaction,
      accountAssets,
      supportedAssets,
    } = props;
    const requestCallId = +navigation.getParam('callId', 0);
    const request = requests.find(({ callId }) => callId === requestCallId);

    this.request = request;
    this.transactionDetails = getTransactionDetails(request);
    this.unsupportedTransaction = isUnsupportedTransaction(this.transactionDetails);

    const gasTokenData = getAssetDataByAddress(getAssetsAsList(accountAssets), supportedAssets, GAS_TOKEN_ADDRESS);
    if (!isEmpty(gasTokenData)) {
      const { decimals, address, symbol } = gasTokenData;
      this.gasToken = { decimals, address, symbol };
    }
  }

  componentDidMount() {
    const requestMethod = get(this.request, 'method');
    if (['eth_sendTransaction', 'eth_signTransaction'].includes(requestMethod)) {
      this.props.fetchGasInfo();
      this.fetchTransactionEstimate();
    }
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

  fetchTransactionEstimate = () => {
    if (this.unsupportedTransaction) return;
    this.setState({ gettingFee: true });
    const { activeAccountAddress, activeAccount } = this.props;
    if (activeAccount && checkIfSmartWalletAccount(activeAccount)) {
      this.updateTxFee();
    } else {
      calculateGasEstimate({ ...this.transactionDetails, from: activeAccountAddress })
        .then(gasLimit => this.setState({ gasLimit }, () => this.updateTxFee()))
        .catch(() => null);
    }
  };

  getGasPriceWei = () => {
    // use requested gasPrice if it exists and is bigger than our average
    // which allows users/dapps to set higher gasPrices to avoid lengthy TXs
    const avgGasPrice = this.props.gasInfo.gasPrice.avg || 0;
    const gasPriceFromRequestHex = this.getGasPriceFromRequest();
    const gasPriceFromRequest = this.transactionHasGasInfo() && gasPriceFromRequestHex ?
      utils.bigNumberify(gasPriceFromRequestHex)
      : 0;
    const gasPrice = gasPriceFromRequest >= avgGasPrice ? gasPriceFromRequestHex : avgGasPrice;
    return utils.parseUnits(gasPrice.toString(), 'gwei');
  };

  /**
   *  we're using our wallet avg gas price and gas limit
   *
   *  the reason we're not using gas price and gas limit provided by WC since it's
   *  optional in platform end while also gas limit and gas price values provided
   *  by platform are not always enough to fulfill transaction
   *
   *  if we start using gasPrice provided by then WC incoming value is gwei in hex
   *  `gasPrice = utils.bigNumberify(gasPrice);`
   *  and both gasPrice and gasLimit is not always present from plaforms
   */
  getTxFeeInWei = (): BigNumber => {
    const { activeAccount } = this.props;
    if (activeAccount && checkIfSmartWalletAccount(activeAccount)) {
      return this.getSmartWalletTxFeeInWei();
    }

    const gasLimit = this.getGasLimit();

    const gasPriceWei = this.getGasPriceWei();

    return gasPriceWei.mul(gasLimit);
  };

  getGasLimit = () => {
    // use requested gasLimit if it exists and is bigger than our average
    const { gasLimit: estGasLimit } = this.state;
    if (!this.transactionHasGasInfo()) return estGasLimit;
    const gasLimitFromRequest = this.getGasLimitFromRequest();
    return gasLimitFromRequest && gasLimitFromRequest > estGasLimit ? gasLimitFromRequest : estGasLimit;
  }

  getRequestParams = () => get(this, 'request.params') || [];

  getGasLimitFromRequest = () => {
    const params = this.getRequestParams();
    try {
      return utils.bigNumberify(params[0].gasLimit);
    } catch (e) {
      return 0;
    }
  }

  transactionHasGasInfo = () => {
    const params = this.getRequestParams();
    if (!params.length) return false;
    const { gasLimit, gasPrice } = params[0];
    if (!(gasLimit && gasPrice)) return false;
    return true;
  }

  getGasPriceFromRequest = () => {
    const params = this.getRequestParams();
    try {
      return params[0].gasPrice;
    } catch (e) {
      return '';
    }
  }

  updateTxFee = async () => {
    const txFeeInWei = await this.getTxFeeInWei();
    this.setState({ txFeeInWei, gettingFee: false });
  };

  getRequestGasInfoObject = (): ?GasInfo => {
    if (!this.transactionHasGasInfo()) return null;
    try {
      return {
        isFetched: false,
        gasPrice: { avg: utils.bigNumberify(this.getGasPriceFromRequest()) },
      };
    } catch (e) {
      return null;
    }
  }

  // to use for SW TXs
  // compare requested gasPrice (if exists) and ours and choose higher
  getGasInfoObjectToUse = () => {
    const historyGasInfo = this.props.gasInfo;
    const requestGasInfo: ?GasInfo = this.getRequestGasInfoObject();
    if (!requestGasInfo) return historyGasInfo;
    const { gasPrice: { avg: historyAvg } } = historyGasInfo;
    const { gasPrice: { avg: requestAvg } } = requestGasInfo;
    if (!(requestAvg && historyAvg)) return historyGasInfo;
    return historyAvg >= requestAvg ? historyGasInfo : requestGasInfo;
  }

  getSmartWalletTxFeeInWei = async (): BigNumber => {
    const { accountAssets, supportedAssets } = this.props;
    const { feeByGasToken } = this.state;

    const gasInfo = this.getGasInfoObjectToUse();

    const {
      amount,
      to: recipient,
      contractAddress,
      data,
    } = this.transactionDetails;
    const value = Number(amount || 0);

    const {
      symbol,
      decimals,
    } = getAssetDataByAddress(getAssetsAsList(accountAssets), supportedAssets, contractAddress);
    const assetData = {
      contractAddress,
      token: symbol,
      decimals,
    };

    const transaction = {
      recipient,
      value,
      data,
      gasToken: this.gasToken,
    };

    const { gasTokenCost, cost: defaultCost } = await smartWalletService
      .estimateAccountTransaction(transaction, gasInfo, assetData)
      .catch(() => ({}));

    // check gas token used for estimation is present, otherwise fallback to ETH
    if (gasTokenCost && gasTokenCost.gt(0)) {
      // set that calculated by gas token if was reset
      if (!feeByGasToken) this.setState({ feeByGasToken: true });
      return gasTokenCost;
    }

    // reset to fee by eth because calculating failed
    if (feeByGasToken) this.setState({ feeByGasToken: false });

    return defaultCost;
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
      contacts,
      balances,
      session,
      theme,
      getTransactionPayload,
      note,
      handleNoteChange,
    } = this.props;

    const {
      txFeeInWei,
      gasLimit,
      gettingFee,
      feeByGasToken,
    } = this.state;

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

    switch (method) {
      case 'eth_sendTransaction':
      case 'eth_signTransaction':
        type = 'Transaction';

        const gasPrice = this.getGasPriceWei().toNumber();
        const estimatePart = {
          txFeeInWei,
          gasLimit,
          gasPrice,
          gasToken: {},
        };
        if (feeByGasToken && this.gasToken) estimatePart.gasToken = this.gasToken;
        transactionPayload = getTransactionPayload(estimatePart, request);

        const {
          to,
          data = '',
          amount,
          symbol,
          decimals,
        } = transactionPayload;

        const parsedGasToken = feeByGasToken && !isEmpty(this.gasToken) ? this.gasToken : null;

        if (this.unsupportedTransaction) {
          errorMessage = 'This data transaction or token is not supported in Pillar Wallet yet';
        } else {
          const txFeeInWeiBN = utils.bigNumberify(txFeeInWei.toString()); // BN compatibility
          if (!isEnoughBalanceForTransactionFee(balances, {
            amount,
            symbol,
            decimals,
            txFeeInWei,
            gasToken: parsedGasToken,
          })) {
            const feeSymbol = get(parsedGasToken, 'symbol', ETH);
            errorMessage = `Not enough ${feeSymbol} for transaction fee`;
          }
          if (!gettingFee && txFeeInWeiBN.eq(0)) {
            errorMessage = 'Unable to calculate transaction fee';
          }
        }

        const feeDisplayValue = formatTransactionFee(txFeeInWei, parsedGasToken);

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
}) => ({
  contacts,
  session,
  gasInfo,
  supportedAssets,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  activeAccount: activeAccountSelector,
  activeAccountAddress: activeAccountAddressSelector,
  accountAssets: accountAssetsSelector,
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
