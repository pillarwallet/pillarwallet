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
import { View, Platform } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { createStructuredSelector } from 'reselect';

// components
import { Footer, ScrollWrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import { Label, MediumText, Paragraph, TextLink } from 'components/Typography';
import SlideModal from 'components/Modals/SlideModal';
import ButtonText from 'components/ButtonText';
import Icon from 'components/Icon';

// constants
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import { EXCHANGE_RECEIVE_EXPLAINED, SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';

// actions
import { fetchGasInfoAction } from 'actions/historyActions';
import { setDismissTransactionAction } from 'actions/exchangeActions';
import { accountBalancesSelector } from 'selectors/balances';

// utils
import { fontSizes, spacing, fontStyles } from 'utils/variables';
import { formatAmount, formatAmountDisplay, getCurrencySymbol } from 'utils/common';
import { getBalance, getRate } from 'utils/assets';
import { getOfferProviderLogo } from 'utils/exchange';
import { getThemeColors, themedColors } from 'utils/themes';

// models, types
import type { GasInfo } from 'models/GasInfo';
import type { Asset, Balances, Rates } from 'models/Asset';
import type { OfferOrder, ProvidersMeta } from 'models/Offer';
import type { TokenTransactionPayload } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';
import type { SessionData } from 'models/Session';

// partials
import ExchangeScheme from './ExchangeScheme';

type Props = {
  navigation: NavigationScreenProp<*>,
  session: SessionData,
  fetchGasInfo: () => void,
  gasInfo: GasInfo,
  rates: Rates,
  baseFiatCurrency: ?string,
  exchangeSupportedAssets: Asset[],
  balances: Balances,
  executingExchangeTransaction: boolean,
  setDismissTransaction: () => void,
  providersMeta: ProvidersMeta,
  theme: Theme,
};

type State = {
  showFeeModal: boolean,
  transactionSpeed: string,
  gasLimit: number,
}

const FooterWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  width: 100%;
`;

const LabeledRow = styled.View`
  margin: 10px 0;
`;

const Value = styled(MediumText)`
  font-size: ${fontSizes.big}px;
`;

const SpeedButton = styled(Button)`
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
`;

const ButtonWrapper = styled.View`
  margin-top: ${spacing.rhythm / 2}px;
  margin-bottom: ${spacing.rhythm + 10}px;
`;

const WarningMessage = styled(Paragraph)`
  text-align: center;
  color: ${themedColors.negative};
  padding-bottom: ${spacing.rhythm}px;
`;

const WalletSwitcher = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
`;

const ChevronWrapper = styled.View`
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
`;

const SelectorChevron = styled(Icon)`
  font-size: 8px;
  color: ${themedColors.primary};
`;


const AllowanceWrapper = styled.View`
  padding: ${spacing.large}px ${spacing.layoutSides}px;
`;

const SettingsWrapper = styled.View`
  padding: 32px ${spacing.layoutSides}px 64px;
`;

const SLOW = 'min';
const NORMAL = 'avg';
const FAST = 'max';

// do not add exchange provider to speed types list as it might not always be present
const SPEED_TYPES = {
  [SLOW]: 'Slow',
  [NORMAL]: 'Normal',
  [FAST]: 'Fast',
};

class ExchangeConfirmScreen extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const { navigation } = this.props;
    const { gasLimit }: OfferOrder = navigation.getParam('offerOrder', {});
    this.state = {
      showFeeModal: false,
      transactionSpeed: NORMAL,
      gasLimit,
    };
  }

  componentDidMount() {
    const { fetchGasInfo } = this.props;
    fetchGasInfo();
  }

  componentDidUpdate(prevProps: Props) {
    const {
      executingExchangeTransaction,
      navigation,
      fetchGasInfo,
      session: { isOnline },
    } = this.props;
    if (!executingExchangeTransaction) {
      navigation.goBack();
      return;
    }
    if (prevProps.session.isOnline !== isOnline && isOnline) {
      fetchGasInfo();
    }
  }

  getGasPriceWei = (txSpeed?: string) => {
    const { transactionSpeed } = this.state;
    txSpeed = txSpeed || transactionSpeed;
    const { gasInfo } = this.props;
    const gasPrice = gasInfo.gasPrice[txSpeed] || 0;
    return utils.parseUnits(gasPrice.toString(), 'gwei');
  };

  getTxFeeInWei = (txSpeed?: string) => {
    const { gasLimit } = this.state;
    const gasPriceWei = this.getGasPriceWei(txSpeed);
    return gasPriceWei.mul(gasLimit);
  };

  renderTxSpeedButtons = () => {
    const { rates, baseFiatCurrency } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    return Object.keys(SPEED_TYPES).map(txSpeed => {
      const feeInEth = formatAmount(utils.formatEther(this.getTxFeeInWei(txSpeed)));
      const feeInFiat = parseFloat(feeInEth) * getRate(rates, ETH, fiatCurrency);
      // $FlowFixMe
      const speedTitle = SPEED_TYPES[txSpeed];
      return (
        <SpeedButton
          key={txSpeed}
          primaryInverted
          onPress={() => this.handleGasPriceChange(txSpeed)}
        >
          <TextLink>{speedTitle} - {feeInEth} ETH</TextLink>
          <Label>{`${getCurrencySymbol(fiatCurrency)}${feeInFiat.toFixed(2)}`}</Label>
        </SpeedButton>
      );
    });
  };

  handleGasPriceChange = (txSpeed: string) => {
    this.setState({
      transactionSpeed: txSpeed,
      showFeeModal: false,
    });
  };

  onConfirmTransactionPress = (offerOrder: OfferOrder) => {
    const {
      navigation,
    } = this.props;
    const {
      transactionSpeed,
      gasLimit,
    } = this.state;

    const {
      payQuantity,
      fromAsset,
      toAsset,
      payToAddress,
      transactionObj: {
        data,
      } = {},
      setTokenAllowance,
      provider,
    } = offerOrder;

    const { code: fromAssetCode, decimals, address: fromAssetAddress } = fromAsset;
    const { code: toAssetCode } = toAsset;

    const gasPrice = this.getGasPriceWei(transactionSpeed);
    const txFeeInWei = gasPrice.mul(gasLimit);

    const transactionPayload: TokenTransactionPayload = {
      gasLimit,
      txFeeInWei,
      gasPrice,
      amount: setTokenAllowance ? 0 : payQuantity,
      to: payToAddress,
      symbol: fromAssetCode,
      contractAddress: fromAssetAddress || '',
      decimals: parseInt(decimals, 10) || 18,
      data,
    };

    if (setTokenAllowance) {
      transactionPayload.extra = {
        allowance: {
          provider,
          fromAssetCode,
          toAssetCode,
        },
      };
    }

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, { transactionPayload, goBackDismiss: true });
  };


  handleBack = () => {
    const {
      setDismissTransaction,
      executingExchangeTransaction,
      navigation,
    } = this.props;
    if (executingExchangeTransaction) {
      setDismissTransaction();
    } else {
      navigation.goBack();
    }
  };

  render() {
    const {
      showFeeModal,
      transactionSpeed,
    } = this.state;
    const {
      navigation,
      session,
      balances,
      providersMeta,
      theme,
    } = this.props;
    const colors = getThemeColors(theme);

    const offerOrder: OfferOrder = navigation.getParam('offerOrder', {});
    const {
      receiveQuantity,
      payQuantity,
      toAsset,
      fromAsset,
      setTokenAllowance,
      provider,
    } = offerOrder;

    const { code: fromAssetCode } = fromAsset;
    const { code: toAssetCode } = toAsset;


    const txFeeInWei = this.getTxFeeInWei(transactionSpeed);
    const ethBalance = getBalance(balances, ETH);
    const balanceInWei = utils.parseUnits(ethBalance.toString(), 'ether');
    const enoughBalance = fromAssetCode === ETH
      ? balanceInWei.sub(utils.parseUnits(payQuantity.toString(), 'ether')).gte(txFeeInWei)
      : balanceInWei.gte(txFeeInWei);
    const errorMessage = !enoughBalance && 'Not enough ETH for transaction fee';

    // const providerInfo = providersMeta.find(({ shim }) => shim === provider) || {};
    // const { name } = providerInfo;
    // const providerName = name || getProviderDisplayName(provider);
    const formattedReceiveAmount = formatAmountDisplay(receiveQuantity);
    const providerLogo = getOfferProviderLogo(providersMeta, provider);

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Confirm exchange' }],
          customOnBack: this.handleBack,
        }}
      >
        <ScrollWrapper>
          {!setTokenAllowance &&
            <ExchangeScheme
              wrapperStyle={{ paddingTop: 56 }}
              fromValue={payQuantity}
              fromAssetCode={fromAssetCode}
              toValue={formattedReceiveAmount}
              toAssetCode={toAssetCode}
              imageSource={providerLogo}
            />
          }
          {!!setTokenAllowance &&
            <AllowanceWrapper>
              <Paragraph small style={{ padding: 20, marginBottom: spacing.medium, paddingTop: spacing.medium }}>
                Review the details and enable asset as well as confirm the cost of data transaction.
              </Paragraph>
              <LabeledRow>
                <Label>Asset to enable</Label>
                <Value>{fromAssetCode}</Value>
              </LabeledRow>

            </AllowanceWrapper>
          }
          <SettingsWrapper>
            <WalletSwitcher onPress={() => navigation.navigate(EXCHANGE_RECEIVE_EXPLAINED)}>
              <TextLink style={{ ...fontStyles.big }}>Legacy Wallet</TextLink>
              <ChevronWrapper>
                <SelectorChevron
                  name="chevron-right"
                  style={{ transform: [{ rotate: '-90deg' }] }}
                />
                <SelectorChevron
                  name="chevron-right"
                  style={{
                    transform: [{ rotate: '90deg' }],
                    marginTop: 2,
                  }}
                />
              </ChevronWrapper>
            </WalletSwitcher>
            <LabeledRow>
              <Label>Transaction fee</Label>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <Value>{formatAmount(utils.formatEther(txFeeInWei))} ETH</Value>
                <ButtonText
                  buttonText="Change"
                  onPress={() => this.setState({ showFeeModal: true })}
                  wrapperStyle={{ marginLeft: 8, marginBottom: Platform.OS === 'ios' ? 2 : -1 }}
                />
              </View>
            </LabeledRow>
          </SettingsWrapper>
        </ScrollWrapper>
        <Footer keyboardVerticalOffset={40} backgroundColor={colors.surface}>
          {!!errorMessage && <WarningMessage small>{errorMessage}</WarningMessage>}
          <FooterWrapper>
            <Button
              disabled={!session.isOnline || !!errorMessage}
              onPress={() => this.onConfirmTransactionPress(offerOrder)}
              title={setTokenAllowance ? 'Enable Asset' : 'Confirm Exchange'}
            />
          </FooterWrapper>
        </Footer>
        <SlideModal
          isVisible={showFeeModal}
          title="Transaction speed"
          onModalHide={() => { this.setState({ showFeeModal: false }); }}
        >
          <Label>Choose your gas price.</Label>
          <Label>Faster transaction requires more fee.</Label>
          <ButtonWrapper>{this.renderTxSpeedButtons()}</ButtonWrapper>
        </SlideModal>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  history: { gasInfo },
  exchange: { data: { executingTransaction: executingExchangeTransaction }, providersMeta, exchangeSupportedAssets },
}: RootReducerState): $Shape<Props> => ({
  session,
  rates,
  baseFiatCurrency,
  gasInfo,
  executingExchangeTransaction,
  providersMeta,
  exchangeSupportedAssets,
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
  setDismissTransaction: () => dispatch(setDismissTransactionAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(ExchangeConfirmScreen));
