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
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

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
import { addressesEqual, isEnoughBalanceForTransactionFee } from 'utils/assets';
import { buildTxFeeInfo } from 'utils/smartWallet';

// services
import smartWalletService from 'services/smartWallet';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { useGasTokenSelector } from 'selectors/smartWallet';

// types
import type { Balances } from 'models/Asset';
import type { GasInfo } from 'models/GasInfo';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { TransactionFeeInfo } from 'models/Transaction';


type Props = {
  navigation: NavigationScreenProp<*>,
  balances: Balances,
  fetchGasInfo: () => void,
  gasInfo: GasInfo,
  isOnline: boolean,
  addRecoveryPortalDevice: (deviceAddress: string, payWithGasToken: boolean) => void,
  addingDeviceAddress: ?string,
  useGasToken: boolean,
};

type State = {
  gettingFee: boolean,
  txFeeInfo: ?TransactionFeeInfo,
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
  t('auth:title.areYouSure'),
  t('auth:recoveryPortal.alert.cancelingRecovery'),
  [
    { text: t('auth:button.confirmSkip'), onPress: () => callback() },
    { text: t('auth:button.dismiss'), style: 'cancel' },
  ],
  { cancelable: true },
);

class RecoveryPortalSetupConnectDevice extends React.PureComponent<Props, State> {
  deviceAddress: string;
  state = {
    txFeeInfo: null,
    gettingFee: true,
  };

  constructor(props: Props) {
    super(props);
    this.deviceAddress = props.navigation.getParam('deviceAddress', '');
  }

  componentDidMount() {
    this.props.fetchGasInfo();
    this.updateDeviceDeploymentFee();
  }

  componentDidUpdate(prevProps: Props) {
    const { isOnline, fetchGasInfo } = this.props;
    if (prevProps.isOnline !== isOnline && isOnline) {
      fetchGasInfo();
    }
  }

  updateDeviceDeploymentFee = () => {
    let txFeeInfo = { fee: new BigNumber(0) };
    this.setState({ gettingFee: true }, async () => {
      const estimated = await smartWalletService
        .estimateAccountDeviceDeployment(this.deviceAddress)
        .then(data => buildTxFeeInfo(data, this.props.useGasToken))
        .catch(() => null);

      if (estimated) txFeeInfo = estimated;

      this.setState({ gettingFee: false, txFeeInfo });
    });
  };

  onNextClick = () => this.props.addRecoveryPortalDevice(this.deviceAddress, this.props.useGasToken);

  renderSpinner = () => <Wrapper style={{ width: '100%', alignItems: 'center' }}><Spinner /></Wrapper>;

  renderDetails = () => {
    const {
      balances,
      isOnline,
      navigation,
      addingDeviceAddress,
    } = this.props;
    const { txFeeInfo, gettingFee } = this.state;

    // fee
    const txFeeBn = txFeeInfo?.fee || new BigNumber(0);
    const balanceCheckTransaction = {
      txFeeInWei: txFeeBn,
      amount: 0,
      gasToken: txFeeInfo?.gasToken,
    };
    const isEnoughForFee = isEnoughBalanceForTransactionFee(balances, balanceCheckTransaction);
    const feeDisplayValue = formatTransactionFee(txFeeBn, txFeeInfo?.gasToken);
    const feeSymbol = txFeeInfo?.gasToken?.symbol || ETH;

    let errorMessage;
    if (!isOnline) {
      errorMessage = t('auth:recoveryPortal.error.cantConnectDevice.deviceIsOffline');
    } else if (!isEnoughForFee) {
      errorMessage = t('auth:recoveryPortal.error.cantConnectDevice.insufficientBalance', { token: feeSymbol });
    }

    const submitButtonTitle = isOnline && gettingFee
      ? t('auth:button.gettingFee')
      : t('auth:button.confirm');

    const isSubmitDisabled = !isEmpty(errorMessage) || gettingFee;
    const isDeviceBeingAdded = addressesEqual(addingDeviceAddress, this.deviceAddress);

    return (
      <React.Fragment>
        <DetailsLine>
          <DetailsTitle>{t('auth:recoveryPortal.label.recoveryDeviceAddress')}</DetailsTitle>
          <DetailsValue>{this.deviceAddress}</DetailsValue>
        </DetailsLine>
        <DetailsLine>
          <DetailsTitle>{t('auth:recoveryPortal.label.estimatedFeeForConnectingToPortal')}</DetailsTitle>
          {gettingFee && <Spinner style={{ marginTop: 5 }} width={20} height={20} />}
          {!gettingFee && <DetailsValue>{feeDisplayValue}</DetailsValue>}
        </DetailsLine>
        {!isEmpty(errorMessage) && !gettingFee && <WarningMessage small>{errorMessage}</WarningMessage>}
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
              buttonText={t('auth:button.cancel')}
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
        headerProps={{ centerItems: [{ title: t('auth:recoveryPortal.title.confirmConnectingToPortal') }] }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ flexGrow: 1 }}>
          <Paragraph small style={{ margin: spacing.large }}>
            {t('auth:recoveryPortal.paragraph.doubleCheckDataBeforeConnectingToPortal')}
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
}: RootReducerState): $Shape<Props> => ({
  isOnline,
  gasInfo,
  addingDeviceAddress,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  useGasToken: useGasTokenSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchGasInfo: () => dispatch(fetchGasInfoAction()),
  addRecoveryPortalDevice: (
    deviceAddress: string,
    payWithGasToken: boolean,
  ) => dispatch(addRecoveryPortalDeviceAction(deviceAddress, payWithGasToken)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(RecoveryPortalSetupConnectDevice);
