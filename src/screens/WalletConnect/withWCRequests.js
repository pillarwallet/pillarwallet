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
import { withNavigation } from 'react-navigation';
import { connect } from 'react-redux';
import { utils, Interface, BigNumber as EthersBigNumber } from 'ethers';
import isEmpty from 'lodash.isempty';
import { createStructuredSelector } from 'reselect';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { rejectCallRequestAction } from 'actions/walletConnectActions';

// constants
import { TOKEN_TRANSFER } from 'constants/functionSignaturesConstants';
import { WALLETCONNECT_PIN_CONFIRM_SCREEN } from 'constants/navigationConstants';
import { ETH } from 'constants/assetsConstants';

// selectors
import { accountBalancesSelector } from 'selectors/balances';

// utils
import { getAssetDataByAddress } from 'utils/assets';

// assets
import ERC20_CONTRACT_ABI from 'abi/erc20.json';

// types
import type { TokenTransactionPayload } from 'models/Transaction';
import type { Asset } from 'models/Asset';
import type { CallRequest } from 'models/WalletConnect';


type Props = {
  navigation: NavigationScreenProp<*>,
  requests: CallRequest[],
  session: Object,
  rejectCallRequest: (callId: number) => void,
  supportedAssets: Asset[],
};

type State = {
  note: ?string,
};

const isTokenTransfer = (data) => typeof data === 'string'
  && data.toLowerCase() !== '0x'
  && data.toLowerCase().startsWith(TOKEN_TRANSFER);

export default function withWCRequests(WrappedComponent: React.ComponentType<*>) {
  const ComponentWithWCTransactions = class extends React.Component<Props, State> {
    state = {
      note: null,
    };

    getTransactionDetails = (request: CallRequest) => {
      if (!request) return {};

      const { supportedAssets } = this.props;
      const { value = 0, data } = request.params[0];

      let { to = '' } = request.params[0];
      let amount;

      const assetData = isTokenTransfer(data)
        ? getAssetDataByAddress([], supportedAssets, to)
        : {};

      if (isEmpty(assetData)) {
        amount = utils.formatEther(EthersBigNumber.from(value).toString());
      } else {
        const iface = new Interface(ERC20_CONTRACT_ABI);
        const parsedTransaction = iface.parseTransaction({ data, value }) || {};
        const {
          args: [
            methodToAddress,
            methodValue = 0,
          ],
        } = parsedTransaction; // get method value and address input
        // do not parse amount as number, last decimal numbers might change after converting
        amount = utils.formatUnits(methodValue, assetData.decimals);
        to = methodToAddress;
      }

      const {
        symbol = ETH,
        address: contractAddress = '',
        decimals = 18,
      } = assetData;

      return {
        to,
        amount,
        data,
        symbol,
        contractAddress,
        decimals,
        note: this.state.note,
      };
    };

    isUnsupportedTransaction = (transaction: TokenTransactionPayload): boolean => {
      const { contractAddress, data } = transaction;
      // unsupported action is if it's our wallet's unsupported token transfer
      return isTokenTransfer(data) && contractAddress === '';
    };

    getTransactionPayload = (estimatePart: Object, request: CallRequest): TokenTransactionPayload => {
      const transaction = this.getTransactionDetails(request);
      return { ...estimatePart, ...transaction };
    };

    acceptWCRequest = (request: CallRequest, transactionPayload?: TokenTransactionPayload) => {
      const { navigation } = this.props;

      switch (request.method) {
        case 'eth_sendTransaction':
        case 'eth_signTransaction':
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

    rejectWCRequest = (request: CallRequest) => this.props.rejectCallRequest(request.callId);

    handleNoteChange = (text) => this.setState({ note: text });

    render() {
      return (
        <WrappedComponent
          acceptWCRequest={this.acceptWCRequest}
          rejectWCRequest={this.rejectWCRequest}
          getTransactionDetails={this.getTransactionDetails}
          getTransactionPayload={this.getTransactionPayload}
          isUnsupportedTransaction={this.isUnsupportedTransaction}
          handleNoteChange={this.handleNoteChange}
          note={this.state.note}
          {...this.props}
        />
      );
    }
  };

  const mapStateToProps = ({
    assets: { supportedAssets },
    contacts: { data: contacts },
    session: { data: session },
    walletConnect: { requests },
  }) => ({
    contacts,
    session,
    supportedAssets,
    requests,
  });

  const structuredSelector = createStructuredSelector({
    balances: accountBalancesSelector,
  });

  const combinedMapStateToProps = (state) => ({
    ...structuredSelector(state),
    ...mapStateToProps(state),
  });

  const mapDispatchToProps = dispatch => ({
    rejectCallRequest: (callId: number) => dispatch(rejectCallRequestAction(callId)),
  });

  return withNavigation(connect(combinedMapStateToProps, mapDispatchToProps)(ComponentWithWCTransactions));
}
