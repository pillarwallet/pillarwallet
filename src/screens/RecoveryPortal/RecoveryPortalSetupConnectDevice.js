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
import { Alert, ScrollView, View } from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import { BigNumber } from 'bignumber.js';
import isEmpty from 'lodash.isempty';
import isEqual from 'lodash.isequal';
import get from 'lodash.get';
import { GAS_TOKEN_ADDRESS } from 'react-native-dotenv';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { fetchGasInfoAction } from 'actions/historyActions';
import { addRecoveryPortalDeviceAction } from 'actions/recoveryPortalActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Wrapper } from 'components/Layout';
import Button from 'components/Button';
import Spinner from 'components/Spinner';
import { Paragraph, BaseText, MediumText } from 'components/Typography';
import ButtonText from 'components/ButtonText';

// utils
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { ETH } from 'constants/assetsConstants';
import { formatTransactionFee } from 'utils/common';
import { checkIfSmartWalletAccount } from 'utils/accounts';
import {
  addressesEqual,
  getAssetDataByAddress,
  getAssetsAsList,
  isEnoughBalanceForTransactionFee,
} from 'utils/assets';

// services
import smartWalletService from 'services/smartWallet';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { activeAccountSelector, isGasTokenSupportedSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';

// types
import type { Asset, Assets, Balances } from 'models/Asset';
import type { GasInfo } from 'models/GasInfo';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Account } from 'models/Account';
import type { GasToken } from 'models/Transaction';


type Props = {
  navigation: NavigationScreenProp<*>,
  balances: Balances,
  fetchGasInfo: () => void,
  gasInfo: GasInfo,
  isOnline: boolean,
  addRecoveryPortalDevice: (deviceAddress: string) => void,
  addingDeviceAddress: ?string,
  activeAccount: ?Account,
  accountAssets: Assets,
  supportedAssets: Asset[],
  isGasTokenSupported: boolean,
};

type State = {
  gettingFee: boolean,
  feeByGasToken: boolean,
  txFeeInWei: BigNumber,
};

const DetailsTitle = styled(BaseText)`
  ${fontStyles.regular};
  color: #999999;
`;

const DetailsValue = styled(MediumText)`
  ${fontStyles.big};
`;

const DetailsLine = styled.View`
  padding-bottom: ${spacing.rhythm}px;
`;

const DetailsWrapper = styled.View`
  padding: 30px ${spacing.large}px 0px ${spacing.large}px;
`;

const WarningMessage = styled(Paragraph)`
  text-align: center;
  color: ${themedColors.negative};
  padding-bottom: ${spacing.rhythm}px;
`;

const cancelPrompt = (callback) => Alert.alert(
  'Are you sure?',
  'You are going to cancel Recovery Portal setup.',
  [
    { text: 'Confirm cancel', onPress: () => callback() },
    { text: 'Dismiss', style: 'cancel' },
  ],
  { cancelable: true },
);

class RecoveryPortalSetupConnectDevice extends React.PureComponent<Props, State> {
  gasToken: ?GasToken;
  deviceAddress: string;

  constructor(props: Props) {
    super(props);
    this.deviceAddress = props.navigation.getParam('deviceAddress', '');

    const {
      activeAccount,
      accountAssets,
      supportedAssets,
      isGasTokenSupported,
    } = props;
    let feeByGasToken = false;
    const gasTokenData = getAssetDataByAddress(getAssetsAsList(accountAssets), supportedAssets, GAS_TOKEN_ADDRESS);
    const isSmartAccount = activeAccount && checkIfSmartWalletAccount(activeAccount);
    if (isSmartAccount
      && isGasTokenSupported
      && !isEmpty(gasTokenData)) {
      const { decimals, address, symbol } = gasTokenData;
      this.gasToken = { decimals, address, symbol };
      feeByGasToken = true;
    }

    this.state = {
      feeByGasToken,
      txFeeInWei: new BigNumber(0),
      gettingFee: true,
    };
  }

  componentDidMount() {
    this.props.fetchGasInfo();
    this.updateDeviceDeploymentFee();
  }

  componentDidUpdate(prevProps: Props) {
    const { isOnline, gasInfo, fetchGasInfo } = this.props;
    if (prevProps.isOnline !== isOnline && isOnline) {
      fetchGasInfo();
    }
    if (!isEqual(prevProps.gasInfo, gasInfo)) {
      this.updateDeviceDeploymentFee();
    }
  }

  updateDeviceDeploymentFee = () => {
    const { gasInfo } = this.props;
    this.setState({ gettingFee: true }, async () => {
      const { gasTokenCost, cost: ethCost } = await smartWalletService
        .estimateAccountDeviceDeployment(this.deviceAddress, gasInfo, this.gasToken)
        .catch(() => {});

      let txFeeInWei;
      const feeByGasToken = gasTokenCost && gasTokenCost.gt(0);
      if (feeByGasToken) {
        txFeeInWei = gasTokenCost;
      } else {
        txFeeInWei = ethCost || new BigNumber(0);
      }

      console.log('feeByGasToken: ', feeByGasToken);
      console.log('gasTokenCost: ', gasTokenCost);
      console.log('ethCost: ', ethCost);
      console.log('updateDeviceDeploymentFee: ', txFeeInWei);

      this.setState({ gettingFee: false, txFeeInWei, feeByGasToken });
    });
  };

  onNextClick = () => this.props.addRecoveryPortalDevice(this.deviceAddress);

  renderSpinner = () => <Wrapper style={{ width: '100%', alignItems: 'center' }}><Spinner /></Wrapper>;

  renderDetails = () => {
    const {
      balances,
      isOnline,
      navigation,
      addingDeviceAddress,
    } = this.props;
    const { txFeeInWei, gettingFee, feeByGasToken } = this.state;

    // fee
    const parsedGasToken = feeByGasToken && !isEmpty(this.gasToken) ? this.gasToken : null;
    const balanceCheckTransaction = {
      txFeeInWei,
      amount: 0,
      gasToken: parsedGasToken,
    };
    const isEnoughForFee = isEnoughBalanceForTransactionFee(balances, balanceCheckTransaction);
    const feeDisplayValue = formatTransactionFee(txFeeInWei, parsedGasToken);
    const feeSymbol = get(parsedGasToken, 'symbol', ETH);

    let errorMessage;
    if (!isOnline) {
      errorMessage = 'You need to be online in order to connect Recovery Portal as device.';
    } else if (!isEnoughForFee) {
      errorMessage = `Not enough ${feeSymbol} for transaction fee`;
    }

    const submitButtonTitle = isOnline && gettingFee
      ? 'Getting fee..'
      : 'Confirm';
    const isSubmitDisabled = !isEmpty(errorMessage) || gettingFee;

    const isDeviceBeingAdded = addressesEqual(addingDeviceAddress, this.deviceAddress);

    return (
      <React.Fragment>
        <DetailsLine>
          <DetailsTitle>Recovery Portal device address</DetailsTitle>
          <DetailsValue>{this.deviceAddress}</DetailsValue>
        </DetailsLine>
        <DetailsLine>
          <DetailsTitle>Est. fee for connect transaction</DetailsTitle>
          {gettingFee && <Spinner style={{ marginTop: 5 }} width={20} height={20} />}
          {!gettingFee && <DetailsValue>{feeDisplayValue}</DetailsValue>}
        </DetailsLine>
        {!isEmpty(errorMessage) && <WarningMessage small>{errorMessage}</WarningMessage>}
        {!isDeviceBeingAdded &&
          <View style={{ alignItems: 'center' }}>
            <Button
              block
              disabled={isSubmitDisabled}
              title={submitButtonTitle}
              onPress={this.onNextClick}
              marginBottom={spacing.large}
            />
            <ButtonText
              buttonText="Cancel"
              onPress={() => cancelPrompt(() => navigation.goBack())}
              fontSize={fontSizes.medium}
            />
          </View>
        }
      </React.Fragment>
    );
  };

  render() {
    const { gasInfo, addingDeviceAddress } = this.props;
    const isDeviceBeingAdded = addressesEqual(addingDeviceAddress, this.deviceAddress);
    const showSpinner = !gasInfo.isFetched || isDeviceBeingAdded;
    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: 'Confirm' }] }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ flexGrow: 1 }}>
          <Paragraph small style={{ margin: spacing.large }}>
            Please confirm that the details below are correct before connecting Recovery Portal as device.
          </Paragraph>
          <DetailsWrapper>
            {showSpinner && this.renderSpinner()}
            {!showSpinner && this.renderDetails()}
          </DetailsWrapper>
        </ScrollView>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  session: { data: { isOnline } },
  history: { gasInfo },
  connectedDevices: { addingDeviceAddress },
  assets: { supportedAssets },
}: RootReducerState): $Shape<Props> => ({
  isOnline,
  gasInfo,
  addingDeviceAddress,
  supportedAssets,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  activeAccount: activeAccountSelector,
  accountAssets: accountAssetsSelector,
  isGasTokenSupported: isGasTokenSupportedSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
  addRecoveryPortalDevice: (deviceAddress: string) => dispatch(addRecoveryPortalDeviceAction(deviceAddress)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(RecoveryPortalSetupConnectDevice);
