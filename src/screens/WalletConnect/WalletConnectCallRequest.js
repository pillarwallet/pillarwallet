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
import { utils, Interface } from 'ethers';
import { CachedImage } from 'react-native-cached-image';
import { createStructuredSelector } from 'reselect';
import { Footer, ScrollWrapper } from 'components/Layout';
import { Label, Paragraph, MediumText } from 'components/Typography';
import Button from 'components/Button';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import TextInput from 'components/TextInput';
import Spinner from 'components/Spinner';
import { rejectCallRequestAction } from 'actions/walletConnectActions';
import { fetchGasInfoAction } from 'actions/historyActions';
import { spacing, fontSizes, fontStyles } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import { getUserName } from 'utils/contacts';
import { getBalance } from 'utils/assets';
import { calculateGasEstimate } from 'services/assets';
import { TOKEN_TRANSFER } from 'constants/functionSignaturesConstants';
import { WALLETCONNECT_PIN_CONFIRM_SCREEN } from 'constants/navigationConstants';
import ERC20_CONTRACT_ABI from 'abi/erc20.json';
import { ETH } from 'constants/assetsConstants';
import { accountBalancesSelector } from 'selectors/balances';
import { activeAccountAddressSelector } from 'selectors';

import type { Asset, Balances } from 'models/Asset';
import type { NavigationScreenProp } from 'react-navigation';
import type { TokenTransactionPayload } from 'models/Transaction';
import type { GasInfo } from 'models/GasInfo';
import type { CallRequest } from 'models/WalletConnect';
import type { Theme } from 'models/Theme';

type Props = {
  navigation: NavigationScreenProp<*>,
  rejectCallRequest: (callId: number) => void,
  requests: CallRequest[],
  session: Object,
  contacts: Object[],
  supportedAssets: Asset[],
  balances: Balances,
  gasInfo: GasInfo,
  fetchGasInfo: Function,
  activeAccountAddress: string,
  theme: Theme,
};

type State = {
  note: ?string,
  gasLimit: number,
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

const genericToken = require('assets/images/tokens/genericToken.png');

class WalletConnectCallRequestScreen extends React.Component<Props, State> {
  request: ?CallRequest = null;

  state = {
    note: null,
    gasLimit: 0,
  };

  componentDidMount() {
    this.props.fetchGasInfo();
    const { navigation, activeAccountAddress, requests } = this.props;

    const requestCallId = +navigation.getParam('callId', 0);
    const request = requests.find(({ callId }) => callId === requestCallId);
    if (!request) {
      return;
    }

    this.request = request;

    if (['eth_sendTransaction', 'eth_signTransaction'].includes(request.method)) {
      calculateGasEstimate({ ...this.transactionDetails(), from: activeAccountAddress })
        .then(gasLimit => this.setState({ gasLimit }))
        .catch(() => null);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const {
      fetchGasInfo,
      session: { isOnline },
    } = this.props;
    if (prevProps.session.isOnline !== isOnline && isOnline) {
      fetchGasInfo();
    }
  }

  handleBack = () => {
    const { navigation } = this.props;
    if (navigation.getParam('goBackDismiss', false)) {
      navigation.dismiss();
    } else {
      navigation.goBack(null);
    }
  };

  transactionDetails = () => {
    const { request } = this;
    if (!request) {
      return {};
    }

    const { supportedAssets } = this.props;
    const { value = 0, data } = request.params[0];
    let { to = '' } = request.params[0];
    let amount = utils.formatEther(utils.bigNumberify(value).toString());
    const asset = supportedAssets.find(
      ({ address: assetAddress = '' }) => assetAddress.toLowerCase() === to.toLowerCase(),
    );
    const isTokenTransfer = data.toLowerCase() !== '0x' && data.toLowerCase().startsWith(TOKEN_TRANSFER);
    if (asset && isTokenTransfer) {
      const iface = new Interface(ERC20_CONTRACT_ABI);
      const parsedTransaction = iface.parseTransaction({ data, value }) || {};
      const {
        args: [
          methodToAddress,
          methodValue = 0,
        ],
      } = parsedTransaction; // get method value and address input
      // do not parse amount as number, last decimal numbers might change after converting
      amount = utils.formatUnits(methodValue, asset.decimals);
      to = methodToAddress;
    }
    return {
      to,
      amount,
      data,
      symbol: asset ? asset.symbol : ETH,
      contractAddress: asset ? asset.address : '',
      decimals: asset ? asset.decimals : 18,
      note: this.state.note,
      isTokenTransfer,
    };
  };

  getTokenTransactionPayload = (): {
    unsupportedAction: boolean,
    transaction: TokenTransactionPayload,
  } => {
    const { gasInfo } = this.props;
    const { gasLimit } = this.state;
    const transaction = this.transactionDetails();
    const { contractAddress, isTokenTransfer } = transaction;

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

    const defaultGasPrice = gasInfo.gasPrice.avg || 0;
    const gasPrice = utils.parseUnits(defaultGasPrice.toString(), 'gwei');
    const txFeeInWei = gasPrice.mul(gasLimit);

    return {
      unsupportedAction: isTokenTransfer && contractAddress === '',
      transaction: {
        ...transaction,
        gasLimit,
        gasPrice,
        txFeeInWei,
      },
    };
  };

  handleFormSubmit = () => {
    Keyboard.dismiss();

    const { request } = this;
    if (!request) {
      return;
    }

    const { navigation } = this.props;

    switch (request.method) {
      case 'eth_sendTransaction':
      case 'eth_signTransaction':
        const {
          transaction: transactionPayload,
        } = this.getTokenTransactionPayload();

        navigation.navigate(WALLETCONNECT_PIN_CONFIRM_SCREEN, {
          callId: request.callId,
          transactionPayload,
        });
        break;

      case 'eth_sign':
      case 'personal_sign':
        navigation.navigate(WALLETCONNECT_PIN_CONFIRM_SCREEN, {
          callId: request.callId,
          transactionPayload: null,
        });
        break;

      default:
        break;
    }
  };

  handleNoteChange(text) {
    this.setState({ note: text });
  }

  handleDismissal = () => {
    const { request } = this;
    const { navigation, rejectCallRequest } = this.props;

    if (request) {
      rejectCallRequest(request.callId);
    }

    navigation.dismiss();
  };

  render() {
    const {
      contacts,
      balances,
      session,
      theme,
    } = this.props;
    const { gasLimit } = this.state;
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

    switch (method) {
      case 'eth_sendTransaction':
      case 'eth_signTransaction':
        type = 'Transaction';

        const {
          unsupportedAction,
          transaction: {
            to,
            data = '',
            amount,
            symbol,
            txFeeInWei,
          },
        } = this.getTokenTransactionPayload();

        if (unsupportedAction) {
          errorMessage = 'This data transaction or token is not supported in Pillar Wallet yet';
        }

        const txFee = utils.formatEther(txFeeInWei.toString());

        const ethBalance = getBalance(balances, ETH);
        const balanceInWei = utils.parseUnits(ethBalance.toString(), 'ether');
        const enoughBalance = symbol === ETH
          ? balanceInWei.sub(utils.parseUnits(amount.toString(), 'ether')).gte(txFeeInWei)
          : balanceInWei.gte(txFeeInWei);
        if (!errorMessage && !enoughBalance) {
          errorMessage = 'Not enough ETH for transaction fee';
        }
        const contact = contacts.find(({ ethAddress }) => to.toUpperCase() === ethAddress.toUpperCase());
        const recipientUsername = getUserName(contact);

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
            {!unsupportedAction &&
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
            <LabeledRow>
              <Label>Est. Network Fee</Label>
              <LabelSub>
                Note: a fee below might be shown as higher than provided on the connected platform,
                however, normally it will be less
              </LabelSub>
              {
                (!!gasLimit && <Value>{txFee} ETH</Value>)
                || <Spinner style={{ marginTop: 5 }} width={20} height={20} />
              }
            </LabeledRow>
            {data.toLowerCase() !== '0x' && (
              <LabeledRow>
                <Label>Data</Label>
                <Value>{data}</Value>
              </LabeledRow>
            )}
            {session.isOnline && !!recipientUsername &&
              <TextInput
                inputProps={{
                  onChange: text => this.handleNoteChange(text),
                  value: this.state.note,
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
          customOnBack: this.handleBack,
        }}
      >
        {body}
        <Footer keyboardVerticalOffset={40} backgroundColor={colors.surface}>
          {!!errorMessage && <WarningMessage small>{errorMessage}</WarningMessage>}
          <FooterWrapper>
            <OptionButton
              primaryInverted
              onPress={this.handleFormSubmit}
              disabled={!!errorMessage || (type === 'Transaction' && !gasLimit)}
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
  contacts: { data: contacts },
  session: { data: session },
  walletConnect: { requests },
  history: { gasInfo },
}) => ({
  contacts,
  session,
  supportedAssets,
  requests,
  gasInfo,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  activeAccountAddress: activeAccountAddressSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = dispatch => ({
  rejectCallRequest: (callId: number) => dispatch(rejectCallRequestAction(callId)),
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(WalletConnectCallRequestScreen));
