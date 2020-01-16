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
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import { utils } from 'ethers';
import { BigNumber } from 'bignumber.js';
import isEmpty from 'lodash.isempty';
import isEqual from 'lodash.isequal';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { fetchGasInfoAction } from 'actions/historyActions';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { addRecoveryPortalDeviceAction } from 'actions/recoveryPortalActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Wrapper } from 'components/Layout';
import Button from 'components/Button';
import Spinner from 'components/Spinner';
import { Paragraph, BaseText, MediumText, TextLink } from 'components/Typography';

// utils
import { fontStyles, spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { ETH, defaultFiatCurrency } from 'constants/assetsConstants';
import { formatAmount, getCurrencySymbol } from 'utils/common';
import { getRate, getBalance } from 'utils/assets';

// services
import smartWalletService from 'services/smartWallet';

// selectors
import { accountBalancesSelector } from 'selectors/balances';

// types, models
import type { Balances, Rates } from 'models/Asset';
import type { GasInfo } from 'models/GasInfo';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';


type Props = {
  navigation: NavigationScreenProp<*>,
  fetchAssetsBalances: () => void,
  balances: Balances,
  fetchGasInfo: () => void,
  gasInfo: GasInfo,
  isOnline: boolean,
  baseFiatCurrency: ?string,
  rates: Rates,
  addRecoveryPortalDevice: (deviceAddress: string) => void,
};

type State = {
  deviceDeploymentStarted: boolean,
  deployEstimateFee: BigNumber,
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

class RecoveryPortalConnectDevice extends React.PureComponent<Props, State> {
  gasLimit: number = 0;
  deviceAddress: string;
  state = {
    deviceDeploymentStarted: false,
    deployEstimateFee: 0,
  };

  constructor(props: Props) {
    super(props);
    this.deviceAddress = props.navigation.getParam('deviceAddress', '');
  }

  componentDidMount() {
    this.updateGasInfoAndBalances();
    this.updateDeviceDeploymentFee();
  }

  componentDidUpdate(prevProps: Props) {
    const { isOnline, gasInfo } = this.props;
    if (prevProps.isOnline !== isOnline && isOnline) {
      this.updateGasInfoAndBalances();
      this.updateDeviceDeploymentFee();
    } else if (!isEqual(prevProps.gasInfo, gasInfo)) {
      this.updateDeviceDeploymentFee();
    }
  }

  updateGasInfoAndBalances = () => {
    const { fetchGasInfo, fetchAssetsBalances } = this.props;
    fetchGasInfo();
    fetchAssetsBalances();
  };

  updateDeviceDeploymentFee = () => {
    const { gasInfo } = this.props;
    const { deployEstimateFee: currentDeployEstimateFee } = this.state;
    // set "getting fee" (fee is 0) state
    if (currentDeployEstimateFee !== 0) this.setState({ deployEstimateFee: 0 });
    smartWalletService.estimateAccountDeviceDeployment(this.deviceAddress, gasInfo)
      .then(deployEstimateFee => this.setState({ deployEstimateFee }))
      .catch(() => {});
  };

  onNextClick = () => {
    const { addRecoveryPortalDevice } = this.props;
    if (this.state.deviceDeploymentStarted) return;
    this.setState({ deviceDeploymentStarted: true });
    addRecoveryPortalDevice(this.deviceAddress);
  };

  renderSpinner = () => <Wrapper style={{ width: '100%', alignItems: 'center' }}><Spinner /></Wrapper>;

  renderDetails = () => {
    const {
      balances,
      baseFiatCurrency,
      rates,
      isOnline,
      navigation,
    } = this.props;
    const { deviceDeploymentStarted, deployEstimateFee } = this.state;

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const fiatSymbol = getCurrencySymbol(fiatCurrency);

    const feeAccountDeviceDeployEthBN = new BigNumber(utils.formatEther(deployEstimateFee.toString()));
    const feeAccountDeviceDeployFiatBN = feeAccountDeviceDeployEthBN.multipliedBy(getRate(rates, ETH, fiatCurrency));
    const feeAccountDeviceDeployEthFormatted = formatAmount(feeAccountDeviceDeployEthBN.toString());
    const accountDeviceDeployFee =
      `${feeAccountDeviceDeployEthFormatted} ETH (${fiatSymbol}${feeAccountDeviceDeployFiatBN.toFixed(2)})`;

    const etherBalanceBN = new BigNumber(getBalance(balances, ETH));
    const notEnoughEtherForContractDeployment = etherBalanceBN.lt(feeAccountDeviceDeployEthBN);

    let errorMessage = '';
    if (!isOnline) {
      errorMessage = 'You need to be online in order to connect Recovery Portal as device.';
    } else if (notEnoughEtherForContractDeployment) {
      errorMessage = 'There is not enough balance.';
    }

    const isGettingDeploymentFee = isOnline && parseFloat(deployEstimateFee.toString()) <= 0;
    const submitButtonTitle = isGettingDeploymentFee
      ? 'Getting fee..'
      : 'Confirm';
    const isSubmitDisabled = !isEmpty(errorMessage) || isGettingDeploymentFee;

    return (
      <React.Fragment>
        <DetailsLine>
          <DetailsTitle>Recovery Portal device address</DetailsTitle>
          <DetailsValue>{this.deviceAddress}</DetailsValue>
        </DetailsLine>
        <DetailsLine>
          <DetailsTitle>Est. fee for connect transaction</DetailsTitle>
          {isGettingDeploymentFee && <Spinner style={{ marginTop: 5 }} width={20} height={20} />}
          {!isGettingDeploymentFee && <DetailsValue>{accountDeviceDeployFee}</DetailsValue>}
        </DetailsLine>
        {!isEmpty(errorMessage) && <WarningMessage small>{errorMessage}</WarningMessage>}
        {!deviceDeploymentStarted &&
          <View style={{ alignItems: 'center' }}>
            <Button
              block
              disabled={isSubmitDisabled}
              title={submitButtonTitle}
              onPress={this.onNextClick}
              marginBottom={spacing.large}
            />
            <TouchableOpacity onPress={() => cancelPrompt(() => navigation.goBack())}>
              <TextLink>Cancel</TextLink>
            </TouchableOpacity>
          </View>
        }
      </React.Fragment>
    );
  };

  render() {
    const { gasInfo } = this.props;
    const { deviceDeploymentStarted } = this.state;
    const showSpinner = !gasInfo.isFetched || deviceDeploymentStarted;
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
  appSettings: { data: { baseFiatCurrency } },
  rates: { data: rates },
}: RootReducerState): $Shape<Props> => ({
  isOnline,
  gasInfo,
  baseFiatCurrency,
  rates,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
  fetchAssetsBalances: () => dispatch(fetchAssetsBalancesAction()),
  addRecoveryPortalDevice: (deviceAddress: string) => dispatch(addRecoveryPortalDeviceAction(deviceAddress)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(RecoveryPortalConnectDevice);
