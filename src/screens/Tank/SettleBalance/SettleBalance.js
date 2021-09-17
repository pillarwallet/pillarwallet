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
import styled, { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { BigNumber } from 'bignumber.js';
import t from 'translations/translate';
import { createStructuredSelector } from 'reselect';

// actions
import { fetchAvailableTxToSettleAction } from 'actions/smartWalletActions';

// components
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import { Label, BaseText, Paragraph } from 'components/legacy/Typography';
import Button from 'components/legacy/Button';
import ListItemWithImage from 'components/legacy/ListItem/ListItemWithImage';
import TankAssetBalance from 'components/TankAssetBalance';
import Checkbox from 'components/legacy/Checkbox';
import RefreshControl from 'components/RefreshControl';
import Spinner from 'components/Spinner';
import Toast from 'components/Toast';

// constants
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { SETTLE_BALANCE_CONFIRM } from 'constants/navigationConstants';
import { CHAIN } from 'constants/chainConstants';

// types
import type { AssetByAddress } from 'models/Asset';
import type { TxToSettle } from 'models/PaymentNetwork';
import type { Theme } from 'models/Theme';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Currency, RatesPerChain } from 'models/Rates';

// utils
import { fontStyles, spacing, fontSizes } from 'utils/variables';
import { formatFiat, formatAmount, groupSectionsByDate } from 'utils/common';
import { addressesEqual, getAssetsAsList } from 'utils/assets';
import { getThemeColors } from 'utils/themes';
import { getAssetRateInFiat } from 'utils/rates';
import { nativeAssetPerChain } from 'utils/chains';

// selectors
import { accountEthereumAssetsSelector } from 'selectors/assets';


type Props = {
  navigation: NavigationScreenProp<*>,
  assetsOnNetwork: Object[],
  baseFiatCurrency: ?Currency,
  ratesPerChain: RatesPerChain,
  assets: AssetByAddress,
  session: Object,
  estimateSettleBalance: Function,
  availableToSettleTx: Object[],
  isFetched: boolean,
  fetchAvailableTxToSettle: Function,
  theme: Theme,
};

type State = {
  txToSettle: TxToSettle[],
};

const MAX_TX_TO_SETTLE = 5;

export const LoadingSpinner = styled(Spinner)`
  padding-top: 20px;
  align-items: center;
  justify-content: center;
`;

const FooterInner = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
  padding: ${spacing.large}px;
`;

const AddonWrapper = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
`;

const BalanceWrapper = styled.View`
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
`;

const ValueInFiat = styled(BaseText)`
  font-size: ${fontSizes.regular}px;
  color: ${({ theme }) => theme.colors.basic010};
`;

const SubtitleView = styled.View`
  background-color: ${({ theme }) => theme.colors.basic050};
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  padding: 30px ${spacing.rhythm}px 25px;
  border-bottom-width: 1px;
  border-color: ${({ theme }) => theme.colors.basic080};
`;

const UnsettledTransactionsList = styled.SectionList`
  width: 100%;
  flex: 1;
`;

const SectionHeaderWrapper = styled.View`
  width: 100%;
  padding: ${spacing.small}px ${spacing.large}px;
`;

const SectionHeader = styled(BaseText)`
  ${fontStyles.regular};
  color: ${({ theme }) => theme.colors.basic010};
`;

class SettleBalance extends React.Component<Props, State> {
  state = {
    txToSettle: [],
  };

  componentDidMount() {
    this.props.fetchAvailableTxToSettle();
  }

  renderItem = ({ item }) => {
    const {
      baseFiatCurrency,
      assets,
      ratesPerChain,
      theme,
    } = this.props;
    const { txToSettle } = this.state;
    const colors = getThemeColors(theme);
    const assetsList = getAssetsAsList(assets);

    const assetSymbol = item?.token?.symbol || nativeAssetPerChain.ethereum.symbol;
    const assetAddress = item?.token?.address || nativeAssetPerChain.ethereum.address;
    const value = item?.value || new BigNumber(0);
    const senderAddress = item?.senderAddress ?? '';

    const ethereumRates = ratesPerChain[CHAIN.ETHEREUM] ?? {};
    const asset = assetsList.find(({ address }) => addressesEqual(address, assetAddress)) ?? {};

    const assetInfo = {
      ...asset,
      symbol: assetSymbol,
      value,
      hash: item.hash,
      createdAt: item.createdAt,
    };

    const nameOrAddress = t('ellipsedMiddleString', {
      stringStart: senderAddress.slice(0, 6),
      stringEnd: senderAddress.slice(-6),
    });
    const formattedAmount = formatAmount(assetInfo.value.toString());
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const totalInFiat = assetInfo.value.toNumber() * getAssetRateInFiat(ethereumRates, assetAddress, fiatCurrency);
    const formattedAmountInFiat = formatFiat(totalInFiat, baseFiatCurrency);
    const isChecked = txToSettle.some(({ hash }) => hash === assetInfo.hash);
    const isDisabled = !isChecked && txToSettle.length === MAX_TX_TO_SETTLE;
    // const itemValue = `${formattedValue} ${notification.asset}`;
    return (
      <ListItemWithImage
        onPress={() => this.toggleItemToTransfer(assetInfo)}
        label={nameOrAddress}
        valueColor={colors.positive}
        customAddon={
          <AddonWrapper>
            <BalanceWrapper>
              <TankAssetBalance amount={formattedAmount} token={assetSymbol} />
              <ValueInFiat>
                {formattedAmountInFiat}
              </ValueInFiat>
            </BalanceWrapper>
            <Checkbox
              onPress={() => this.toggleItemToTransfer(assetInfo)}
              checked={isChecked}
              disabled={isDisabled}
              rounded
              wrapperStyle={{ width: 24, marginRight: 4, marginLeft: 12 }}
            />
          </AddonWrapper>
        }
        rightColumnInnerStyle={{ flexDirection: 'row' }}
      />
    );
  };

  toggleItemToTransfer = (tx: Object) => {
    const { txToSettle } = this.state;
    let updatedTxToSettle;
    if (txToSettle.find(({ hash }) => hash === tx.hash)) {
      updatedTxToSettle = txToSettle.filter(({ hash }) => hash !== tx.hash);
    } else if (txToSettle.length === MAX_TX_TO_SETTLE) {
      Toast.show({
        message: t('toast.tooManyTransactionsToSettle', { maxTxToSettle: MAX_TX_TO_SETTLE }),
        emoji: 'hushed',
      });
      return;
    } else {
      updatedTxToSettle = [...txToSettle, tx];
    }
    this.setState({ txToSettle: updatedTxToSettle });
  };

  goToConfirm = () => {
    const { navigation } = this.props;
    const { txToSettle } = this.state;
    navigation.navigate(SETTLE_BALANCE_CONFIRM, { txToSettle });
  };

  render() {
    const {
      session,
      availableToSettleTx,
      isFetched,
    } = this.props;
    const { txToSettle } = this.state;
    const showSpinner = !isFetched;
    const formattedFeedData = groupSectionsByDate(availableToSettleTx, 1);
    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: t('ppnContent.title.settleTransactionsScreen') }] }}
        footer={(
          <FooterInner style={{ alignItems: 'center' }}>
            <Label>&nbsp;</Label>
            {!!txToSettle.length && (
              <Button
                small
                disabled={!session.isOnline}
                title={t('button.next')}
                block={false}
                onPress={this.goToConfirm}
              />
            )}
          </FooterInner>
        )}
      >
        {showSpinner && <LoadingSpinner />}
        {!showSpinner &&
          <React.Fragment>
            <SubtitleView>
              <Paragraph light small>{t('ppnContent.label.transactionsAvailableToSettle')}</Paragraph>
              <Paragraph style={{ textAlign: 'right', marginLeft: 4 }} small>
                {t('valueOfValue', { partOfValue: txToSettle.length, allValue: MAX_TX_TO_SETTLE })}
              </Paragraph>
            </SubtitleView>
            <UnsettledTransactionsList
              sections={formattedFeedData}
              initialNumToRender={6}
              renderSectionHeader={({ section }) => (
                <SectionHeaderWrapper>
                  <SectionHeader>{section.title}</SectionHeader>
                </SectionHeaderWrapper>
              )}
              renderItem={this.renderItem}
              getItemLayout={(data, index) => ({
                length: 70,
                offset: 70 * index,
                index,
              })}
              maxToRenderPerBatch={7}
              onEndReachedThreshold={0.5}
              keyExtractor={item => item.hash}
              contentContainerStyle={{ flexGrow: 1, paddingTop: 10 }}
              removeClippedSubviews
              stickySectionHeadersEnabled={false}
              refreshControl={
                <RefreshControl
                  refreshing={false}
                  onRefresh={() => {
                    this.props.fetchAvailableTxToSettle();
                  }}
                />
              }
            />
          </React.Fragment>
        }
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  rates: { data: ratesPerChain },
  appSettings: { data: { baseFiatCurrency } },
  session: { data: session },
  paymentNetwork: { availableToSettleTx: { data: availableToSettleTx, isFetched } },
}: RootReducerState): $Shape<Props> => ({
  ratesPerChain,
  baseFiatCurrency,
  session,
  availableToSettleTx,
  isFetched,
});

const structuredSelector = createStructuredSelector({
  assets: accountEthereumAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchAvailableTxToSettle: () => dispatch(fetchAvailableTxToSettleAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(SettleBalance));
