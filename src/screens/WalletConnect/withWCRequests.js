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
import { utils, Interface } from 'ethers';
import { createStructuredSelector } from 'reselect';
import { rejectCallRequestAction } from 'actions/walletConnectActions';
import { fetchGasInfoAction } from 'actions/historyActions';
import { calculateGasEstimate } from 'services/assets';
import { TOKEN_TRANSFER } from 'constants/functionSignaturesConstants';
import { WALLETCONNECT_PIN_CONFIRM_SCREEN } from 'constants/navigationConstants';
import ERC20_CONTRACT_ABI from 'abi/erc20.json';
import { ETH } from 'constants/assetsConstants';
import { accountBalancesSelector } from 'selectors/balances';
import { activeAccountAddressSelector } from 'selectors';
import type { NavigationScreenProp } from 'react-navigation';
import type { TokenTransactionPayload } from 'models/Transaction';
import type { GasInfo } from 'models/GasInfo';
import type { Asset } from 'models/Asset';
import type { CallRequest } from 'models/WalletConnect';

type Props = {
  navigation: NavigationScreenProp<*>,
  requests: CallRequest[],
  session: Object,
  rejectCallRequest: (callId: number) => void,
  gasInfo: GasInfo,
  fetchGasInfo: () => void,
  activeAccountAddress: string,
  supportedAssets: Asset[],
};

type State = {
  note: ?string,
  gasLimit: number,
};

export default function withWCRequests(WrappedComponent: React.ComponentType<*>) {
  const ComponentWithWCTransactions = class extends React.Component<Props, State> {
    state = {
      note: null,
      gasLimit: 0,
    };

    componentDidMount() {
      this.props.fetchGasInfo();
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

    transactionDetails = (request) => {
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

    getTokenTransactionPayload = (gasLimit, request): {
      unsupportedAction: boolean,
      transaction: TokenTransactionPayload,
    } => {
      const { gasInfo } = this.props;
      const transaction = this.transactionDetails(request);
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

    acceptWCRequest = async request => {
      const { navigation, activeAccountAddress } = this.props;

      switch (request.method) {
        case 'eth_sendTransaction':
        case 'eth_signTransaction':
          const gasLimit = await calculateGasEstimate({
            ...this.transactionDetails(request),
            from: activeAccountAddress,
          });

          const {
            transaction: transactionPayload,
          } = this.getTokenTransactionPayload(gasLimit, request);

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
    }

    rejectWCRequest = request => {
      const { rejectCallRequest } = this.props;
      rejectCallRequest(request.callId);
    }

    handleNoteChange(text) {
      this.setState({ note: text });
    }

    render() {
      return (
        <WrappedComponent
          acceptWCRequest={this.acceptWCRequest}
          rejectWCRequest={this.rejectWCRequest}
          transactionDetails={this.transactionDetails}
          getTokenTransactionPayload={this.getTokenTransactionPayload}
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

  return withNavigation(connect(combinedMapStateToProps, mapDispatchToProps)(ComponentWithWCTransactions));
}
