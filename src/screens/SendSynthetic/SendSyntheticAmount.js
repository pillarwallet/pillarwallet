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
import { connect } from 'react-redux';
import isEmpty from 'lodash.isempty';
import debounce from 'lodash.debounce';
import { createStructuredSelector } from 'reselect';
import t from 'translations/translate';
import { BigNumber } from 'bignumber.js';

// components
import { Label } from 'components/legacy/Typography';
import Toast from 'components/Toast';

// actions
import { fetchAvailableSyntheticAssetsAction } from 'actions/syntheticsActions';
import { fetchSingleChainAssetRatesAction } from 'actions/ratesActions';

// utils
import { parseNumber, valueForAddress, addressAsKey } from 'utils/common';
import { getReceiverWithEnsName } from 'utils/contacts';
import { isValidValueForTransfer } from 'utils/transactions';

// constants
import { PLR } from 'constants/assetsConstants';
import { ACCOUNTS, SEND_TOKEN_CONFIRM } from 'constants/navigationConstants';
import { CHAIN } from 'constants/chainConstants';

// models, types
import type { NavigationScreenProp } from 'react-navigation';
import type { AssetOption } from 'models/Asset';
import type { TransactionPayload } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Contact } from 'models/Contact';

// services
import archanovaService from 'services/archanova';

// selectors
import { contactsSelector } from 'selectors';
import { activeSyntheticAssetsSelector } from 'selectors/synthetics';

// Local
import SendContainer from './SendContainer';

type Props = {
  navigation: NavigationScreenProp<any>,
  isOnline: boolean,
  fetchSingleEthereumAssetRates: (asset: Object) => void,
  isFetchingSyntheticAssets: boolean,
  fetchAvailableSyntheticAssets: () => void,
  contacts: Contact[],
  syntheticAssets: AssetOption[],
};

type State = {
  value: ?BigNumber,
  submitPressed: boolean,
  intentError: ?string,
  receiver?: string,
  receiverEnsName?: string,
  selectedContact: ?Contact,
  assetData: ?AssetOption,
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
      selectedContact: null,
      assetData: null,
      receiver: '',
      receiverEnsName: '',
    };

    this.handleAssetValueSelect = debounce(this.handleAssetValueSelect, 500);
  }

  componentDidMount() {
    const { fetchAvailableSyntheticAssets } = this.props;
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

  handleReceiverSelect = async (value: ?Contact) => {
    const { navigation } = this.props;
    const { ethAddress } = value ?? {};

    const userInfo = !!ethAddress && (await archanovaService.searchAccount(ethAddress).catch(null));

    if (userInfo) {
      this.setReceiver(value);
    } else {
      Alert.alert(
        t('alert.addressIsNotOnPillarNetwork.title'),
        t('alert.addressIsNotOnPillarNetwork.message'),
        [
          {
            text: t('alert.addressIsNotOnPillarNetwork.button.switchToMainnet'),
            onPress: () => navigation.navigate(ACCOUNTS),
          },
          { text: t('alert.addressIsNotOnPillarNetwork.button.cancel'), style: 'cancel' },
        ],
        { cancelable: true },
      );
    }
  };

  setReceiver = async (value: ?Contact) => {
    const resolved = await getReceiverWithEnsName(value?.ethAddress);
    let stateToUpdate = {};
    if (!resolved?.receiver) {
      Toast.show({
        message: t('toast.ensNameNotFound'),
        emoji: 'woman-shrugging',
      });
      stateToUpdate = { selectedContact: null, receiver: '', receiverEnsName: '' };
    } else {
      const { receiver, receiverEnsName = '' } = resolved;
      stateToUpdate = { selectedContact: value, receiver, receiverEnsName };
    }

    this.setState(stateToUpdate);
  };

  handleAssetValueSelect = (value: ?BigNumber, assetData: ?AssetOption) => {
    const { intentError } = this.state;
    const { fetchSingleEthereumAssetRates } = this.props;
    let updatedState = { value, assetData };
    const assetAddress = assetData?.address ?? assetData?.contractAddress;
    if (value && assetAddress) {
      fetchSingleEthereumAssetRates({
        ...assetData,
        address: assetAddress,
      });
    }

    if (intentError) updatedState = { ...updatedState, intentError: null };
    this.setState(updatedState);
  };

  formSubmitComplete = (callback?: Function = () => {}) => {
    this.setState({ submitPressed: false }, callback);
  };

  handleFormSubmit = () => {
    const defaultAssetData = this.props.syntheticAssets.find(({ symbol }) => symbol === PLR);
    const { submitPressed, value, receiver, receiverEnsName } = this.state;
    let { assetData } = this.state;
    assetData = assetData || defaultAssetData;
    if (submitPressed || !assetData || !value || !receiver) return;

    const { token: assetCode = '', contractAddress = '', decimals } = assetData;
    this.setState({ submitPressed: true, intentError: null }, () => {
      const { navigation } = this.props;
      const amount = parseNumber(value);
      Keyboard.dismiss();

      /**
       * go through regular confirm as PLR is already staked by the user
       * so he owns it and previous synthetic assets deprecated
       */
      if (!assetCode === PLR) {
        Toast.show({
          message: t('toast.cannotSendSyntheticAsset'),
          emoji: 'woman-shrugging',
          supportLink: true,
        });
        return;
      }

      const transactionPayload: TransactionPayload = {
        to: receiver,
        receiverEnsName,
        amount,
        gasLimit: 0,
        gasPrice: 0,
        txFeeInWei: 0,
        usePPN: true,
        symbol: assetCode,
        contractAddress,
        decimals: decimals || 18,
        chain: CHAIN.ETHEREUM,
      };

      this.formSubmitComplete(() => {
        navigation.navigate(SEND_TOKEN_CONFIRM, {
          transactionPayload,
          source: this.source,
        });
      });
    });
  };

  render() {
    const { isOnline, contacts, syntheticAssets, isFetchingSyntheticAssets } = this.props;
    const { value, submitPressed, intentError, selectedContact, receiver, assetData } = this.state;

    const defaultAssetData: AssetOption = syntheticAssets.find(({ symbol }) => symbol === PLR) || syntheticAssets[0];

    const showFeesLabel = !isEmpty(value) && !!receiver && !intentError;
    const showNextButton = showFeesLabel;

    const customBalances = syntheticAssets
      .map((asset) => ({ address: asset.address, balance: asset.balance?.syntheticBalance || '0' }))
      .reduce((balances, assetBalance) => {
        balances[addressAsKey(assetBalance.address)] = assetBalance;
        return balances;
      }, {});

    const resolvedAssetData = assetData ?? defaultAssetData;
    const balance = BigNumber(valueForAddress(customBalances, resolvedAssetData?.contractAddress)?.balance || 0);
    const isNextButtonDisabled = !isValidValueForTransfer(value, balance) || !isOnline || !!intentError;

    return (
      <SendContainer
        isLoading={isFetchingSyntheticAssets || syntheticAssets.length === 0}
        assetData={resolvedAssetData}
        onAssetDataChange={(newAssetData) => this.handleAssetValueSelect(value, newAssetData)}
        value={value}
        onValueChange={(newValue) => this.setState({ value: newValue })}
        customAssets={syntheticAssets}
        customBalances={customBalances}
        customSelectorProps={{
          contacts,
          selectedContact,
          onSelectContact: this.handleReceiverSelect,
        }}
        footerProps={{
          isNextButtonVisible: showNextButton,
          buttonProps: {
            onPress: this.handleFormSubmit,
            disabled: isNextButtonDisabled,
            isLoading: submitPressed,
          },
          footerTopAddon: showFeesLabel && <Label small>{t('ppnContent.label.paidByPillar')}</Label>,
        }}
      />
    );
  }
}

const mapStateToProps = ({
  session: {
    data: { isOnline },
  },
  synthetics: { isFetching: isFetchingSyntheticAssets },
}: RootReducerState): $Shape<Props> => ({
  isOnline,
  isFetchingSyntheticAssets,
});

const structuredSelector = createStructuredSelector({
  contacts: contactsSelector,
  syntheticAssets: activeSyntheticAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchSingleEthereumAssetRates: (asset: Object) => dispatch(fetchSingleChainAssetRatesAction(CHAIN.ETHEREUM, asset)),
  fetchAvailableSyntheticAssets: () => dispatch(fetchAvailableSyntheticAssetsAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(SendSyntheticAmount);
