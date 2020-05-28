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
import styled, { withTheme } from 'styled-components/native';
import { connect } from 'react-redux';
import { utils } from 'ethers';
import { createStructuredSelector } from 'reselect';
import BigNumber from 'bignumber.js';
import isEqual from 'lodash.isequal';
import get from 'lodash.get';

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
import Spinner from 'components/Spinner';

// constants
import { defaultFiatCurrency, ETH, SPEED_TYPE_LABELS, SPEED_TYPES } from 'constants/assetsConstants';
import { EXCHANGE_RECEIVE_EXPLAINED, SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { EXCHANGE, NORMAL } from 'constants/exchangeConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// actions
import { fetchGasInfoAction } from 'actions/historyActions';
import { setDismissTransactionAction } from 'actions/exchangeActions';

// utils
import { fontSizes, spacing } from 'utils/variables';
import {
  formatAmount,
  formatAmountDisplay,
  formatTransactionFee,
  getCurrencySymbol,
} from 'utils/common';
import {
  isEnoughBalanceForTransactionFee,
  getAssetDataByAddress,
  getAssetsAsList,
  getRate,
} from 'utils/assets';
import { buildTxFeeInfo, userHasSmartWallet } from 'utils/smartWallet';
import { getOfferProviderLogo } from 'utils/exchange';
import { themedColors } from 'utils/themes';
import { getAccountName } from 'utils/accounts';

// services
import { calculateGasEstimate } from 'services/assets';
import smartWalletService from 'services/smartWallet';

// types
import type { GasInfo } from 'models/GasInfo';
import type { Asset, Assets, Balances, Rates } from 'models/Asset';
import type { OfferOrder, ProvidersMeta } from 'models/Offer';
import type { TokenTransactionPayload, TransactionFeeInfo } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { SessionData } from 'models/Session';
import type { Account, Accounts } from 'models/Account';
import type { Theme } from 'models/Theme';

// selectors
import { activeAccountAddressSelector, activeAccountSelector } from 'selectors';
import { accountAssetsSelector } from 'selectors/assets';
import { accountBalancesSelector } from 'selectors/balances';
import { isActiveAccountSmartWalletSelector, useGasTokenSelector } from 'selectors/smartWallet';

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
  accounts: Accounts,
  theme: Theme,
  activeAccountAddress: string,
  activeAccount: ?Account,
  accountAssets: Assets,
  supportedAssets: Asset[],
  isSmartAccount: boolean,
  useGasToken: boolean,
};

type State = {
  showFeeModal: boolean,
  transactionSpeed: string,
  gasLimit: number,
  txFeeInfo: ?TransactionFeeInfo,
  gettingFee: boolean,
};


const MainWrapper = styled.View`
  background-color: ${themedColors.card};
  padding: 55px 0 64px;
  flex: 1;
  justify-content: center;
`;

const FooterWrapper = styled.View`
  justify-content: center;
  align-items: center;
  padding: ${spacing.large}px ${spacing.layoutSides}px 100px;
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
  margin: 30px 0;
`;

const SafeArea = styled.SafeAreaView`
  width: 100%;
  justify-content: center;
  position: absolute;
  left: 0;
  bottom: 0;
`;

const ButtonWrapper = styled.SafeAreaView`
  margin: ${spacing.large}px ${spacing.layoutSides}px;
`;

class ExchangeConfirmScreen extends React.Component<Props, State> {
  transactionPayload: TokenTransactionPayload;

  state = {
    showFeeModal: false,
    transactionSpeed: NORMAL,
    txFeeInfo: null,
    gasLimit: 0,
    gettingFee: true,
  };

  constructor(props: Props) {
    super(props);
    const { transactionPayload } = props.navigation.getParam('offerOrder');
    this.transactionPayload = transactionPayload;
  }

  componentDidMount() {
    if (!this.props.isSmartAccount) {
      this.props.fetchGasInfo();
    }
    this.fetchTransactionEstimate();
  }

  componentDidUpdate(prevProps: Props) {
    const {
      executingExchangeTransaction,
      navigation,
      fetchGasInfo,
      session: { isOnline },
      gasInfo,
    } = this.props;
    if (!executingExchangeTransaction) {
      navigation.goBack();
      return;
    }
    if (prevProps.session.isOnline !== isOnline && isOnline) {
      fetchGasInfo();
    }
    if (!isEqual(prevProps.gasInfo, gasInfo)) {
      this.fetchTransactionEstimate();
    }
  }

  fetchTransactionEstimate = async () => {
    const { activeAccountAddress, isSmartAccount } = this.props;
    const { transactionSpeed } = this.state;
    const txSpeed = transactionSpeed || SPEED_TYPES.NORMAL;
    this.setState({ gettingFee: true });

    let gasLimit;
    if (!isSmartAccount) {
      gasLimit = await calculateGasEstimate({ ...this.transactionPayload, from: activeAccountAddress });
      this.setState({ gasLimit });
    }

    const txFeeInfo = isSmartAccount
      ? await this.getSmartWalletTxFee()
      : this.getKeyWalletTxFee(txSpeed, gasLimit);

    this.setState({ txFeeInfo, gettingFee: false });
  };

  getSmartWalletTxFee = async (): Promise<TransactionFeeInfo> => {
    const { accountAssets, supportedAssets, useGasToken } = this.props;
    const defaultResponse = { fee: new BigNumber(0) };

    const {
      amount,
      to: recipient,
      contractAddress,
      data,
    } = this.transactionPayload;
    const value = Number(amount || 0);

    const { symbol, decimals } =
      getAssetDataByAddress(getAssetsAsList(accountAssets), supportedAssets, contractAddress);
    const assetData = { contractAddress, token: symbol, decimals };

    let transaction = { recipient, value };
    if (data) transaction = { ...transaction, data };

    const estimated = await smartWalletService
      .estimateAccountTransaction(transaction, assetData)
      .then(result => buildTxFeeInfo(result, useGasToken))
      .catch(() => null);

    if (!estimated) {
      return defaultResponse;
    }

    return estimated;
  };

  getKeyWalletTxFee = (txSpeed?: string, gasLimit?: number): TransactionFeeInfo => {
    const { gasInfo } = this.props;
    txSpeed = txSpeed || SPEED_TYPES.NORMAL;
    gasLimit = gasLimit || this.state.gasLimit || 0;

    const gasPrice = gasInfo.gasPrice[txSpeed] || 0;
    const gasPriceWei = utils.parseUnits(gasPrice.toString(), 'gwei');

    return {
      fee: gasPriceWei.mul(gasLimit),
    };
  };

  renderTxSpeedButtons = () => {
    const { rates, baseFiatCurrency, isSmartAccount } = this.props;
    if (isSmartAccount) return null;

    const { transactionSpeed } = this.state;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    const speedOptions = Object.keys(SPEED_TYPE_LABELS).map(txSpeed => {
      const feeInEth = formatAmount(utils.formatEther(this.getKeyWalletTxFee(txSpeed).fee));
      const feeInFiat = parseFloat(feeInEth) * getRate(rates, ETH, fiatCurrency);
      const speedTitle = SPEED_TYPE_LABELS[txSpeed];
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

  onConfirmTransactionPress = (offerOrder) => {
    const { navigation, isSmartAccount } = this.props;
    const { txFeeInfo } = this.state;
    if (!txFeeInfo) return;

    const {
      fromAsset,
      toAsset,
      setTokenAllowance,
      provider,
    } = offerOrder;

    let transactionPayload = { ...this.transactionPayload };

    transactionPayload.txFeeInWei = txFeeInfo.fee;
    if (txFeeInfo.gasToken) transactionPayload.gasToken = txFeeInfo.gasToken;

    if (!isSmartAccount) {
      const { gasLimit, transactionSpeed } = this.state;
      const gasPrice = txFeeInfo.fee.div(gasLimit).toNumber();
      transactionPayload = {
        ...transactionPayload,
        gasPrice,
        gasLimit,
        txSpeed: transactionSpeed,
      };
    }

    if (setTokenAllowance) {
      transactionPayload.extra = {
        allowance: {
          provider,
          fromAssetCode: fromAsset.code,
          toAssetCode: toAsset.code,
        },
      };
    }

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      goBackDismiss: true,
      transactionType: EXCHANGE,
    });
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
    const { showFeeModal, txFeeInfo, gettingFee } = this.state;
    const {
      navigation,
      session,
      balances,
      providersMeta,
      baseFiatCurrency,
      rates,
      accounts,
      theme,
      isSmartAccount,
    } = this.props;

    const hasSmartWallet = userHasSmartWallet(accounts);

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

    const feeSymbol = get(txFeeInfo?.gasToken, 'symbol', ETH);
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const { decimals, amount, symbol } = this.transactionPayload;

    let isEnoughForFee = true;
    let feeDisplayValue = '';
    let feeInFiat = 0;
    if (txFeeInfo) {
      feeDisplayValue = formatTransactionFee(txFeeInfo.fee, txFeeInfo.gasToken);
      feeInFiat = parseFloat(feeDisplayValue) * getRate(rates, feeSymbol, fiatCurrency);
      isEnoughForFee = isEnoughBalanceForTransactionFee(balances, {
        amount,
        decimals,
        symbol,
        txFeeInWei: txFeeInfo.fee,
        gasToken: txFeeInfo.gasToken,
      });
    }

    const errorMessage = !isEnoughForFee && `Not enough ${feeSymbol} for transaction fee`;
    const formattedReceiveAmount = formatAmountDisplay(receiveQuantity);

    const providerLogo = getOfferProviderLogo(providersMeta, provider, theme, 'vertical');
    const confirmButtonTitleDefault = setTokenAllowance ? 'Enable Asset' : 'Confirm';
    const confirmButtonTitle = gettingFee ? 'Getting the fee..' : confirmButtonTitleDefault;

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: 'Details' }],
          customOnBack: this.handleBack,
        }}
      >
        <ScrollWrapper contentContainerStyle={{ minHeight: '100%' }}>
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
                <Paragraph small style={{ marginVertical: spacing.medium }}>
                  Review the details and enable asset as well as confirm the cost of data transaction.
                </Paragraph>
                <LabeledRow>
                  <BaseText medium secondary>Asset to enable</BaseText>
                  <MediumText big>{fromAssetCode}</MediumText>
                </LabeledRow>

              </AllowanceWrapper>
            }
            {!hasSmartWallet && <ButtonText
              buttonText={getAccountName(ACCOUNT_TYPES.KEY_BASED)}
              rightIconProps={{ name: 'selector', style: { fontSize: 16 } }}
              onPress={() => navigation.navigate(EXCHANGE_RECEIVE_EXPLAINED)}
              wrapperStyle={{ marginTop: 0 }}
            />}
            {!!hasSmartWallet &&
              <SettingsWrapper>
                <BaseText secondary regular center style={{ marginBottom: 0 }}>
                  The assets will be transferred to your Smart Wallet.
                </BaseText>
              </SettingsWrapper>
            }
            <SettingsWrapper>
              {!gettingFee &&
                <BaseText secondary regular center style={{ marginBottom: 4 }}>
                  Transaction fee {feeDisplayValue} ({getCurrencySymbol(fiatCurrency)}{feeInFiat.toFixed(2)})
                </BaseText>
              }
              {!!gettingFee && <Spinner style={{ marginTop: 5, alignSelf: 'center' }} width={20} height={20} />}
              {!!errorMessage &&
                <BaseText negative regular center style={{ marginBottom: 4 }}>
                  {errorMessage}
                </BaseText>
              }
              {!gettingFee && !isSmartAccount &&
                <ButtonText
                  buttonText="Speed settings"
                  leftIconProps={{ name: 'options', style: { fontSize: 16 } }}
                  onPress={() => this.setState({ showFeeModal: true })}
                />
              }
            </SettingsWrapper>
          </MainWrapper>
          <FooterWrapper>
            {!setTokenAllowance &&
            <React.Fragment>
              <BaseText small center style={{ maxWidth: 242 }}>
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
        <SafeArea>
          <ButtonWrapper>
            <Button
              block
              disabled={!session.isOnline || !!errorMessage || gettingFee}
              onPress={() => this.onConfirmTransactionPress(offerOrder)}
              title={confirmButtonTitle}
            />
          </ButtonWrapper>
        </SafeArea>
        <SlideModal
          isVisible={showFeeModal}
          onModalHide={() => { this.setState({ showFeeModal: false }); }}
          hideHeader
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
  accounts: { data: accounts },
  assets: { supportedAssets },
}: RootReducerState): $Shape<Props> => ({
  session,
  rates,
  baseFiatCurrency,
  gasInfo,
  executingExchangeTransaction,
  providersMeta,
  exchangeSupportedAssets,
  accounts,
  supportedAssets,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  activeAccount: activeAccountSelector,
  activeAccountAddress: activeAccountAddressSelector,
  accountAssets: accountAssetsSelector,
  isSmartAccount: isActiveAccountSmartWalletSelector,
  useGasToken: useGasTokenSelector,
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
