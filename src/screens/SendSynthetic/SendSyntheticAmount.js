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
import { Alert, Keyboard } from 'react-native';
import { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import isEmpty from 'lodash.isempty';
import debounce from 'lodash.debounce';
import t from 'translations/translate';

// components
import { Label } from 'components/Typography';
import SendContainer from 'containers/SendContainer';
import Toast from 'components/Toast';

// actions
import { fetchAvailableSyntheticAssetsAction, initSyntheticsServiceAction } from 'actions/syntheticsActions';
import { fetchSingleAssetRatesAction } from 'actions/ratesActions';

// utils, services
import { parseNumber } from 'utils/common';
import syntheticsService from 'services/synthetics';
import { getReceiverWithEnsName } from 'utils/contacts';

// constants
import { PLR } from 'constants/assetsConstants';
import {
  ACCOUNTS,
  SEND_SYNTHETIC_CONFIRM,
  SEND_TOKEN_CONFIRM,
} from 'constants/navigationConstants';

// models, types
import type { AssetData } from 'models/Asset';
import type { SyntheticTransaction, TokenTransactionPayload } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Option } from 'models/Selector';

// services
import smartWalletService from 'services/smartWallet';


type Props = {
  initSyntheticsService: () => void,
  navigation: NavigationScreenProp<*>,
  isOnline: boolean,
  fetchSingleAssetRates: (assetCode: string) => void,
  isOnline: boolean,
  isFetchingSyntheticAssets: boolean,
  fetchAvailableSyntheticAssets: () => void,
};

type State = {
  value: ?string,
  submitPressed: boolean,
  intentError: ?string,
  inputHasError: boolean,
  receiver?: string,
  receiverEnsName?: string,
  selectedContact: ?Option,
  assetData: ?AssetData,
};


class SendSyntheticAmount extends React.Component<Props, State> {
  source: string;

  constructor(props: Props) {
    super(props);
    const {
      navigation: { getParam: getNavigationParam },
    } = props;

    this.source = getNavigationParam('source', '');

    this.state = {
      intentError: '',
      submitPressed: false,
      value: null,
      inputHasError: false,
      selectedContact: null,
      assetData: null,
      receiver: '',
      receiverEnsName: '',
    };

    this.handleAssetValueSelect = debounce(this.handleAssetValueSelect, 500);
  }

  componentDidMount() {
    const { initSyntheticsService, fetchAvailableSyntheticAssets } = this.props;
    initSyntheticsService();
    fetchAvailableSyntheticAssets();
    this.setPreselectedValues();
  }

  setPreselectedValues = () => {
    const { navigation } = this.props;
    const contact = navigation.getParam('contact');
    if (contact) {
      const { userName, ethAddress } = contact;
      const receiver = {
        name: userName || ethAddress,
        ethAddress,
        value: ethAddress,
      };
      this.handleReceiverSelect(receiver);
    }
  };

  handleReceiverSelect = async (value: Option, onSuccess?: () => void) => {
    const { navigation } = this.props;
    const { ethAddress } = value;

    const userInfo = !!ethAddress && await smartWalletService.searchAccount(ethAddress).catch(null);

    if (userInfo) {
      this.setReceiver(value, onSuccess);
    } else {
      Alert.alert(
        'This address is not on Pillar Network',
        'Invite it\'s owner to install Pillar wallet in order to be able to send instant transactions ' +
        'for free or switch to Ethereum Mainet to send regular transaction.',
        [
          { text: 'Switch to Ethereum Mainnet', onPress: () => navigation.navigate(ACCOUNTS) },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true },
      );
    }
  };

  setReceiver = async (value: Option, onSuccess?: () => void) => {
    const { receiverEnsName, receiver } = await getReceiverWithEnsName(value?.ethAddress);
    let stateToUpdate = {};
    if (!receiver) {
      Toast.show({
        message: t('toast.ensNameNotFound'),
        emoji: 'woman-shrugging',
      });
      stateToUpdate = { selectedContact: null, receiver: '', receiverEnsName: '' };
    } else {
      stateToUpdate = { selectedContact: value, receiver, receiverEnsName };
    }
    this.setState(stateToUpdate, () => { if (onSuccess) onSuccess(); });
  };

  handleAssetValueSelect = (value?: Object) => {
    const { intentError } = this.state;
    const { fetchSingleAssetRates } = this.props;
    let updatedState = { value: value?.input, assetData: value?.selector };
    if (value) fetchSingleAssetRates(value.selector.token);

    if (intentError) updatedState = { ...updatedState, intentError: null };
    this.setState(updatedState);
  };

  manageFormErrorState = (errorMessage: ?string) => {
    const { inputHasError } = this.state;
    const newErrorState = !!errorMessage;
    if (inputHasError !== newErrorState) this.setState({ inputHasError: newErrorState });
  };

  formSubmitComplete = (callback?: Function = () => {}) => {
    this.setState({ submitPressed: false }, callback);
  };

  handleFormSubmit = () => {
    const {
      submitPressed,
      value,
      assetData,
      receiver,
      receiverEnsName,
    } = this.state;
    if (submitPressed || !assetData || !value || !receiver) return;

    const { token: assetCode, contractAddress = '', decimals } = assetData;
    this.setState({ submitPressed: true, intentError: null }, () => {
      const { navigation } = this.props;
      const amount = parseNumber(value);
      Keyboard.dismiss();
      if (assetCode === PLR) {
        // go through regular confirm as PLR is staked by the user already so he owns it
        const transactionPayload: TokenTransactionPayload = {
          to: receiver,
          receiverEnsName,
          amount,
          gasLimit: 0,
          gasPrice: 0,
          txFeeInWei: 0,
          usePPN: true,
          symbol: assetCode,
          contractAddress,
          decimals,
        };
        this.formSubmitComplete(() => {
          navigation.navigate(SEND_TOKEN_CONFIRM, {
            transactionPayload,
            source: this.source,
          });
        });
        return;
      }
      syntheticsService
        .createExchangeIntent(receiver, amount, assetCode)
        .then((result) => {
          const { output: { transactionId, exchangeAmount } } = result;
          this.formSubmitComplete(() => {
            const syntheticTransaction: SyntheticTransaction = {
              transactionId,
              fromAmount: exchangeAmount,
              toAmount: amount,
              toAssetCode: assetCode,
              toAddress: receiver,
              receiverEnsName,
            };
            Keyboard.dismiss();
            navigation.navigate(SEND_SYNTHETIC_CONFIRM, {
              syntheticTransaction,
              assetData,
              source: this.source,
            });
          });
        })
        .catch(() => {
          this.setState({
            submitPressed: false,
            intentError: 'Failed to calculate synthetics exchange',
          });
        });
    });
  };

  render() {
    const { isOnline, isFetchingSyntheticAssets } = this.props;
    const {
      value,
      submitPressed,
      intentError,
      inputHasError,
      selectedContact,
      receiver,
    } = this.state;

    const showFeesLabel = !isEmpty(value) && !!receiver && !intentError;
    const showNextButton = showFeesLabel;

    const isNextButtonDisabled = inputHasError || !isOnline || !!intentError;

    return (
      <SendContainer
        customSelectorProps={{
          onOptionSelect: this.handleReceiverSelect,
          options: [],
          selectedOption: selectedContact,
        }}
        customValueSelectorProps={{
          showSyntheticOptions: true,
          getFormValue: this.handleAssetValueSelect,
          getError: this.manageFormErrorState,
          customError: intentError,
          isLoading: isFetchingSyntheticAssets,
        }}
        footerProps={{
          isNextButtonVisible: showNextButton,
          buttonProps: {
            onPress: this.handleFormSubmit,
            disabled: isNextButtonDisabled,
            isLoading: submitPressed,
          },
          footerTopAddon: showFeesLabel && <Label small>No fees - paid by Pillar</Label>,
        }}
      />
    );
  }
}

const mapStateToProps = ({
  session: { data: { isOnline } },
  synthetics: { isFetching: isFetchingSyntheticAssets },
}: RootReducerState): $Shape<Props> => ({
  isOnline,
  isFetchingSyntheticAssets,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  initSyntheticsService: () => dispatch(initSyntheticsServiceAction()),
  fetchSingleAssetRates: (assetCode: string) => dispatch(fetchSingleAssetRatesAction(assetCode)),
  fetchAvailableSyntheticAssets: () => dispatch(fetchAvailableSyntheticAssetsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(SendSyntheticAmount);
