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
import { connect } from 'react-redux';
import { SafeAreaView } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';
import { createStructuredSelector } from 'reselect';
import isEqual from 'lodash.isequal';
import { utils } from 'ethers';
import styled, { withTheme } from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';

// components
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import { MediumText, BaseText } from 'components/Typography';
import RadioButton from 'components/RadioButton';
import { Spacing } from 'components/Layout';

// services
import { calculateGasEstimate } from 'services/assets';
import smartWalletService from 'services/smartWallet';

// constants
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { SMART_WALLET_UNLOCK, ASSETS } from 'constants/navigationConstants';

// actions
import { fetchGasInfoAction } from 'actions/historyActions';
import { switchAccountAction } from 'actions/accountsActions';
import { deploySmartWalletAction } from 'actions/smartWalletActions';

// utils
import { spacing } from 'utils/variables';
import { getRate, getAssetsAsList, getBalance } from 'utils/assets';
import { formatFiat, getGasPriceWei } from 'utils/common';
import { findKeyBasedAccount } from 'utils/accounts';
import { images } from 'utils/images';

// selectors
import { balancesSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';

// types
import type { Balances, Rates, Assets } from 'models/Asset';
import type { RootReducerState } from 'reducers/rootReducer';
import type { Accounts } from 'models/Account';
import type { GasInfo } from 'models/GasInfo';
import type { Theme } from 'models/Theme';


type Props = {
  theme: Theme,
  navigation: NavigationScreenProp<*>,
  isVisible: Boolean,
  onClose: () => void,
  baseFiatCurrency: ?string,
  rates: Rates,
  accounts: Accounts,
  gasInfo: GasInfo,
  balances: {
    [account: string]: Balances,
  },
  assets: Assets,
  fetchGasInfo: () => void,
  deploySmartWallet: () => void,
  switchAccount: (accountId: string) => void,
};

type State = {
  selectedWallet: ?string,
  totalFees: {
    [accountType: string]: number,
  },
  feesLoaded: boolean,
};

const OptionContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0;
`;

const OptionLeft = styled.View`
  flex-direction: row;
  align-items: center;
`;

const ModalContainer = styled.View`
  padding: 20px ${spacing.layoutSides}px 80px;
`;


const Option = ({
  name, checked, eth, onPress,
}) => {
  return (
    <OptionContainer>
      <OptionLeft>
        <RadioButton checked={checked} onPress={onPress} />
        <Spacing w={8} />
        <MediumText big>{name}</MediumText>
      </OptionLeft>
      <BaseText medium secondary>{eth} ETH</BaseText>
    </OptionContainer>
  );
};


class SWActivationModal extends React.Component<Props, State> {
  _isMounted: boolean;
  deployEstimateFee: number = 0;
  ethTransferGasEstimate: number = 0;

  state = {
    selectedWallet: null,
    totalFees: {},
    feesLoaded: false,
  };

  componentDidMount() {
    this._isMounted = true;
    const { fetchGasInfo } = this.props;
    fetchGasInfo();
    this.fetchEstimations();
  }

  componentDidUpdate(prevProps: Props) {
    const { gasInfo } = this.props;
    if (!isEqual(prevProps.gasInfo, gasInfo)) {
      this.fetchEstimations();
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  fetchEstimations = async () => {
    const { accounts, gasInfo } = this.props;
    if (!gasInfo.isFetched) return;

    this.deployEstimateFee = await smartWalletService.estimateAccountDeployment(gasInfo).catch(() => {});
    if (!this.deployEstimateFee) return;

    const smartWallet = accounts.find(account => account.type === ACCOUNT_TYPES.SMART_WALLET);
    const keyBasedWallet = accounts.find(account => account.type === ACCOUNT_TYPES.KEY_BASED);

    this.ethTransferGasEstimate = await calculateGasEstimate({
      symbol: ETH,
      from: keyBasedWallet && keyBasedWallet.id,
      to: smartWallet && smartWallet.id,
      amount: this.deployEstimateFee,
    }).catch(() => {});
    if (!this.ethTransferGasEstimate) return;

    this.updateFees();
  };

  getAccountBalance = (accountType) => {
    const { accounts, balances } = this.props;
    const foundAccount = accounts.find(account => account.type === accountType);
    if (!foundAccount) return 0;
    return getBalance(balances[foundAccount.id], ETH);
  };

  updateFees = () => {
    const { selectedWallet } = this.state;

    const ethBalanceInSmartWallet = this.getAccountBalance(ACCOUNT_TYPES.SMART_WALLET);
    const ethBalanceInKeyWallet = this.getAccountBalance(ACCOUNT_TYPES.KEY_BASED);
    const totalFees = this.calculateFeesPerAccount();
    const enoughInSmartWallet = ethBalanceInSmartWallet > totalFees[ACCOUNT_TYPES.SMART_WALLET];
    const enoughInKeyWallet = ethBalanceInKeyWallet > totalFees[ACCOUNT_TYPES.KEY_BASED];

    let updateState = {
      feesLoaded: true,
      totalFees,
    };
    if (!selectedWallet && (enoughInKeyWallet || enoughInSmartWallet)) {
      updateState = {
        ...updateState,
        selectedWallet: enoughInSmartWallet ? ACCOUNT_TYPES.SMART_WALLET : ACCOUNT_TYPES.KEY_BASED,
      };
    }

    if (!this._isMounted) return;
    this.setState({ ...updateState });
  };

  calculateFeesPerAccount = () => {
    const { gasInfo } = this.props;
    const gasPriceWei = getGasPriceWei(gasInfo);
    const smartWalletFee = parseInt(this.deployEstimateFee, 10);
    const keyBasedFee = smartWalletFee + gasPriceWei.mul(this.ethTransferGasEstimate).toNumber();

    return {
      [ACCOUNT_TYPES.SMART_WALLET]: parseFloat(utils.formatEther(smartWalletFee.toString())),
      [ACCOUNT_TYPES.KEY_BASED]: parseFloat(utils.formatEther(keyBasedFee.toString())),
    };
  };

  deployFromLegacyWallet = async () => {
    const {
      switchAccount,
      accounts,
      navigation,
      gasInfo,
      assets,
    } = this.props;
    const keyBasedAccount = findKeyBasedAccount(accounts);
    if (!keyBasedAccount) return;

    await switchAccount(keyBasedAccount.id);

    const gasPriceWei = getGasPriceWei(gasInfo);
    const gasPrice = gasPriceWei.toNumber();
    const assetsArray = getAssetsAsList(assets);
    const asset = assetsArray.find(({ symbol }) => symbol === ETH);
    if (!asset) return;

    const { symbol, decimals } = asset;
    navigation.navigate(SMART_WALLET_UNLOCK, {
      transferTransactions: [{
        gasLimit: this.ethTransferGasEstimate,
        gasPrice,
        symbol,
        decimals,
        amount: parseFloat(utils.formatEther(this.deployEstimateFee.toString())),
      }],
    });
  };

  activateSW = () => {
    const { selectedWallet } = this.state;
    const { deploySmartWallet, onClose, navigation } = this.props;
    if (!selectedWallet) return;
    if (selectedWallet === ACCOUNT_TYPES.SMART_WALLET) {
      deploySmartWallet();
      navigation.navigate(ASSETS);
    } else {
      this.deployFromLegacyWallet();
    }
    if (onClose) onClose();
  };

  getFormattedAmount = (amount) => {
    const { baseFiatCurrency, rates } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const balanceInFiat = amount * getRate(rates, ETH, fiatCurrency);
    return formatFiat(balanceInFiat, baseFiatCurrency || defaultFiatCurrency);
  };

  render() {
    const { theme, isVisible, onClose } = this.props;
    const { selectedWallet, totalFees, feesLoaded } = this.state;

    const ethBalanceInSmartWallet = this.getAccountBalance(ACCOUNT_TYPES.SMART_WALLET);
    const ethBalanceInKeyWallet = this.getAccountBalance(ACCOUNT_TYPES.KEY_BASED);
    const enoughInSmartWallet = feesLoaded && ethBalanceInSmartWallet > totalFees[ACCOUNT_TYPES.SMART_WALLET];
    const enoughInKeyWallet = feesLoaded && ethBalanceInKeyWallet > totalFees[ACCOUNT_TYPES.KEY_BASED];

    let buttonEnabled = false;
    if (selectedWallet) {
      buttonEnabled = selectedWallet === ACCOUNT_TYPES.SMART_WALLET ? enoughInSmartWallet : enoughInKeyWallet;
    }

    let feeText = '';
    if (feesLoaded && selectedWallet) {
      const transactionEstimate = totalFees[selectedWallet] || 0;
      feeText = `${transactionEstimate} ETH (${this.getFormattedAmount(transactionEstimate)})`;
    }

    let buttonText = '';
    if (!feesLoaded) {
      buttonText = 'Loading fees...';
    } else {
      buttonText = buttonEnabled ? 'Activate' : 'Not enough ETH';
    }

    const { smartWalletIcon } = images(theme);

    return (
      <SlideModal
        isVisible={isVisible}
        onModalHide={onClose}
        hideHeader
      >
        <SafeAreaView>
          <ModalContainer>
            <MediumText center medium>Activate Smart Wallet</MediumText>
            <Spacing h={18} />
            <CachedImage
              style={{ width: 64, height: 64, alignSelf: 'center' }}
              source={smartWalletIcon}
            />
            <Spacing h={20} />
            <BaseText medium>
              Enable better security and free instant transactions via Pillar Network. You will get a new badge too.
            </BaseText>
            <Spacing h={15} />
            <Option
              name="From Smart Wallet"
              eth={ethBalanceInSmartWallet}
              checked={selectedWallet === ACCOUNT_TYPES.SMART_WALLET}
              onPress={() => enoughInSmartWallet && this.setState({ selectedWallet: ACCOUNT_TYPES.SMART_WALLET })}
            />
            <Option
              name="From Key wallet"
              eth={ethBalanceInKeyWallet}
              checked={selectedWallet === ACCOUNT_TYPES.KEY_BASED}
              onPress={() => enoughInKeyWallet && this.setState({ selectedWallet: ACCOUNT_TYPES.KEY_BASED })}
            />
            <Spacing h={15} />
            <Button
              secondary
              title={buttonText}
              disabled={!buttonEnabled}
              onPress={this.activateSW}
            />
            <Spacing h={20} />
            <BaseText regular center secondary>
              Transaction fee{'\n'}{feeText}
            </BaseText>
          </ModalContainer>
        </SafeAreaView>
      </SlideModal>
    );
  }
}

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
  rates: { data: rates },
  accounts: { data: accounts },
  history: { gasInfo },
}) => ({
  baseFiatCurrency,
  rates,
  accounts,
  gasInfo,
});

const structuredSelector = createStructuredSelector({
  balances: balancesSelector,
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
  deploySmartWallet: () => dispatch(deploySmartWalletAction()),
  switchAccount: (accountId: string) => dispatch(switchAccountAction(accountId)),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(SWActivationModal));
