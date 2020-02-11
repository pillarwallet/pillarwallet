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
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { createStructuredSelector } from 'reselect';

// components
import { ScrollWrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import { MediumText, Paragraph, BaseText } from 'components/Typography';
import SlideModal from 'components/Modals/SlideModal';
import ButtonText from 'components/ButtonText';
import HyperLink from 'components/HyperLink';
import SelectorList from 'components/SelectorList';
import TitleWithIcon from 'components/Title/TitleWithIcon';

// constants
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import { EXCHANGE_RECEIVE_EXPLAINED, SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { EXCHANGE } from 'constants/exchangeConstants';

// actions
import { fetchGasInfoAction } from 'actions/historyActions';
import { setDismissTransactionAction } from 'actions/exchangeActions';
import { accountBalancesSelector } from 'selectors/balances';

// utils
import { fontSizes, spacing } from 'utils/variables';
import { formatAmount, formatAmountDisplay, getCurrencySymbol } from 'utils/common';
import { getBalance, getRate } from 'utils/assets';
import { getOfferProviderLogo } from 'utils/exchange';
import { themedColors } from 'utils/themes';

// models, types
import type { GasInfo } from 'models/GasInfo';
import type { Asset, Balances, Rates } from 'models/Asset';
import type { OfferOrder, ProvidersMeta } from 'models/Offer';
import type { TokenTransactionPayload } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
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
};

type State = {
  showFeeModal: boolean,
  transactionSpeed: string,
  gasLimit: number,
}

const MainWrapper = styled.View`
  background-color: ${themedColors.card};
  padding: 55px 0 64px;
  flex: 1;
  justify-content: center;
`;

const FooterWrapper = styled.View`
  justify-content: center;
  align-items: center;
  padding: 54px ${spacing.layoutSides}px 36px;
  width: 100%;
  background-color: ${themedColors.surface};
  border-top-color: ${themedColors.border};
  border-top-width: 1px;
`;

const LabeledRow = styled.View`
  margin: 10px 0;
`;

const AllowanceWrapper = styled.View`
  flex: 1;
  padding: ${spacing.large}px ${spacing.layoutSides}px;
`;

const SettingsWrapper = styled.View`
  padding: 32px ${spacing.layoutSides}px 0;
  justify-content: center;
`;

const SliderContentWrapper = styled.View`
  margin-bottom: 30px;
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
    const { transactionSpeed } = this.state;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    const speedOptions = Object.keys(SPEED_TYPES).map(txSpeed => {
      const feeInEth = formatAmount(utils.formatEther(this.getTxFeeInWei(txSpeed)));
      const feeInFiat = parseFloat(feeInEth) * getRate(rates, ETH, fiatCurrency);
      const speedTitle = SPEED_TYPES[txSpeed];
      return {
        id: speedTitle,
        label: speedTitle,
        valueToShow: `${feeInEth} ETH (${getCurrencySymbol(fiatCurrency)}${feeInFiat.toFixed(2)})`,
        value: txSpeed,
      };
    });

    return (
      <SelectorList
        onSelect={(selectedValue) => this.handleGasPriceChange(selectedValue.toString())}
        options={speedOptions}
        selectedValue={transactionSpeed}
        numColumns={3}
        minItemWidth={90}
      />
    );
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

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, { transactionPayload, goBackDismiss: true, transactionType: EXCHANGE });
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
      baseFiatCurrency,
      rates,
    } = this.props;

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
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const feeInEth = formatAmount(utils.formatEther(txFeeInWei));
    const feeInFiat = parseFloat(feeInEth) * getRate(rates, ETH, fiatCurrency);
    const ethBalance = getBalance(balances, ETH);
    const balanceInWei = utils.parseUnits(ethBalance.toString(), 'ether');
    const enoughBalance = fromAssetCode === ETH
      ? balanceInWei.sub(utils.parseUnits(payQuantity.toString(), 'ether')).gte(txFeeInWei)
      : balanceInWei.gte(txFeeInWei);
    const errorMessage = !enoughBalance && 'Not enough ETH for transaction fee';
    const formattedReceiveAmount = formatAmountDisplay(receiveQuantity);
    const providerLogo = getOfferProviderLogo(providersMeta, provider);

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Details' }],
          customOnBack: this.handleBack,
        }}
      >
        <ScrollWrapper
          contentContainerStyle={{ minHeight: '100%' }}
        >
          <MainWrapper>
            {!setTokenAllowance &&
              <ExchangeScheme
                fromValue={payQuantity}
                fromAssetCode={fromAssetCode}
                toValue={formattedReceiveAmount}
                toAssetCode={toAssetCode}
                imageSource={providerLogo}
              />
            }
            {!!setTokenAllowance &&
              <AllowanceWrapper>
                <Paragraph
                  small
                  style={{ marginVertical: spacing.medium }}
                >
                  Review the details and enable asset as well as confirm the cost of data transaction.
                </Paragraph>
                <LabeledRow>
                  <BaseText medium secondary>Asset to enable</BaseText>
                  <MediumText big>{fromAssetCode}</MediumText>
                </LabeledRow>

              </AllowanceWrapper>
            }
            <ButtonText
              buttonText="Legacy Wallet"
              rightIconProps={{ name: 'selector', style: { fontSize: 16 } }}
              onPress={() => navigation.navigate(EXCHANGE_RECEIVE_EXPLAINED)}
              wrapperStyle={{ marginTop: 0 }}
            />
            <SettingsWrapper>
              <BaseText secondary regular center style={{ marginBottom: 4 }}>
                Transaction fee {formatAmount(utils.formatEther(txFeeInWei))} ETH
                ({getCurrencySymbol(fiatCurrency)}{feeInFiat.toFixed(2)})
              </BaseText>
              {!!errorMessage &&
              <BaseText negative regular center style={{ marginBottom: 4 }}>
                {errorMessage}
              </BaseText>}
              <ButtonText
                buttonText="Advanced options"
                leftIconProps={{ name: 'options', style: { fontSize: 16 } }}
                onPress={() => this.setState({ showFeeModal: true })}
              />
            </SettingsWrapper>
          </MainWrapper>
          <FooterWrapper>
            <Button
              block
              disabled={!session.isOnline || !!errorMessage}
              onPress={() => this.onConfirmTransactionPress(offerOrder)}
              title={setTokenAllowance ? 'Enable Asset' : 'Confirm'}
            />
            {!setTokenAllowance &&
            <React.Fragment>
              <BaseText small center style={{ maxWidth: 242, marginTop: 24 }}>
                Final rate may be slightly higher or lower at the end of the transaction.
              </BaseText>
              <HyperLink
                style={{ fontSize: fontSizes.small }}
                url="https://help.pillarproject.io/en/articles/3487702-why-did-i-receive-less-tokens"
              >
                Read more
              </HyperLink>
            </React.Fragment>}
          </FooterWrapper>
        </ScrollWrapper>
        <SlideModal
          isVisible={showFeeModal}
          onModalHide={() => { this.setState({ showFeeModal: false }); }}
          showHeader={false}
        >
          <SliderContentWrapper>
            <TitleWithIcon iconName="lightning" title="Speed" />
            {this.renderTxSpeedButtons()}
          </SliderContentWrapper>
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

export default connect(combinedMapStateToProps, mapDispatchToProps)(ExchangeConfirmScreen);
