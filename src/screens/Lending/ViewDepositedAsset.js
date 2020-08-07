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
import React from 'react';
import { connect } from 'react-redux';
import { CachedImage } from 'react-native-cached-image';
import isEmpty from 'lodash.isempty';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import type { NavigationScreenProp } from 'react-navigation';
import { getEnv } from 'configs/envConfig';

// actions
import { fetchDepositedAssetAction } from 'actions/lendingActions';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { RefreshControl } from 'react-native';
import { ScrollWrapper } from 'components/Layout';
import { BaseText, MediumText, TextLink } from 'components/Typography';
import CircleButton from 'components/CircleButton';
import ActivityFeed from 'components/ActivityFeed';
import ShadowedCard from 'components/ShadowedCard';

// constants
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import { LENDING_ENTER_DEPOSIT_AMOUNT, LENDING_ENTER_WITHDRAW_AMOUNT } from 'constants/navigationConstants';

// utils
import { formatAmountDisplay, formatFiat } from 'utils/common';
import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { getRate } from 'utils/assets';
import { mapTransactionsHistory } from 'utils/feedData';
import { isAaveTransactionTag } from 'utils/aave';

// selectors
import { smartAccountHistorySelector } from 'selectors/history';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { DepositedAsset, Rates } from 'models/Asset';
import type { Accounts } from 'models/Account';
import type { BadgeRewardEvent } from 'models/Badge';

type Props = {
  depositedAssets: DepositedAsset[],
  isFetchingDepositedAssets: boolean,
  fetchDepositedAsset: (symbol: string) => void,
  baseFiatCurrency: ?string,
  rates: Rates,
  accounts: Accounts,
  smartAccountHistory: Object[],
  navigation: NavigationScreenProp<*>,
  badgesEvents: BadgeRewardEvent[],
};

const ValuesWrapper = styled.View`
  margin: 0 ${spacing.large}px ${spacing.large}px;
  justify-content: center;
  align-items: center;
`;

const TokenValueWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const TokenValue = styled(MediumText)`
  ${fontStyles.giant};
`;

const TokenSymbol = styled(MediumText)`
  ${fontStyles.medium};
  margin-top: 14px;
  margin-left: ${spacing.small}px;
`;

const ValueInFiat = styled(BaseText)`
  ${fontStyles.small};
  text-align: center;
`;

const ImagesWrapper = styled.View`
  flex-direction: row;
  margin: ${spacing.large}px;
  justify-content: center;
  align-items: center;
`;

const CurrentInterestRate = styled.View`
  flex-direction: row;
  margin: ${spacing.large}px ${spacing.large}px ${spacing.large}px;
  justify-content: center;
  align-items: center;
`;

const InterestRate = styled(TextLink)`
  ${fontStyles.regular};
  margin-left: 7;
`;

const AssetButtonsWrapper = styled.View`
  margin-top: 40px;
  padding-bottom: 30px;
  flex-direction: row;
  justify-content: center;
  border-bottom-width: 1px;
  border-color: ${themedColors.border};
`;

const DetailsWrapper = styled.View`
  padding: ${spacing.large}px ${spacing.large}px 0px;
`;

const aaveImage = require('assets/images/apps/aave.png');

const ViewDepositedAsset = ({
  navigation,
  isFetchingDepositedAssets,
  fetchDepositedAsset,
  rates,
  baseFiatCurrency,
  accounts,
  smartAccountHistory,
  depositedAssets,
  badgesEvents,
}: Props) => {
  const depositedAsset: DepositedAsset = navigation.getParam('depositedAsset', {});
  const {
    iconUrl,
    earnInterestRate,
    symbol: assetSymbol,
    earnedAmount,
    earningsPercentageGain,
  } = depositedAsset;

  // always fetch balance from what's latest updated while also keep the screen present if whole asset was withdrawn
  const { currentBalance = 0 } = depositedAssets.find(({ symbol }) => symbol === depositedAsset.symbol) || {};

  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const valueInFiat = parseFloat(currentBalance) * getRate(rates, assetSymbol, fiatCurrency);
  const valueInFiatFormatted = formatFiat(valueInFiat, fiatCurrency);
  const aaveTransactions = mapTransactionsHistory(
    smartAccountHistory.filter(({ tag }) => isAaveTransactionTag(tag)),
    accounts,
    TRANSACTION_EVENT,
  );

  const activityFeedData = [...aaveTransactions];
  const firstDepositBadgeEvent = badgesEvents.find(({ badgeType }) => badgeType === 'first-aave-deposit');
  if (firstDepositBadgeEvent) activityFeedData.push(firstDepositBadgeEvent);

  return (
    <ContainerWithHeader
      navigation={navigation}
      headerProps={{ centerItems: [{ title: 'Your deposit' }] }}
      inset={{ bottom: 0 }}
    >
      <ScrollWrapper
        refreshControl={
          <RefreshControl
            refreshing={isFetchingDepositedAssets}
            onRefresh={() => fetchDepositedAsset(assetSymbol)}
          />
        }
      >
        <CurrentInterestRate>
          <BaseText secondary>Current APY</BaseText>
          <InterestRate>{formatAmountDisplay(earnInterestRate)}%</InterestRate>
        </CurrentInterestRate>
        <ImagesWrapper>
          <CachedImage
            style={{ width: 48, height: 48, marginRight: -80 }}
            source={aaveImage}
            resizeMode="contain"
          />
          <CachedImage
            style={{ width: 48, height: 48 }}
            source={{ uri: iconUrl ? `${getEnv('SDK_PROVIDER')}/${iconUrl}?size=3` : '' }}
            resizeMode="contain"
          />
        </ImagesWrapper>
        <ValuesWrapper>
          <TokenValueWrapper>
            <TokenValue>{formatAmountDisplay(currentBalance)}</TokenValue>
            <TokenSymbol>{assetSymbol}</TokenSymbol>
          </TokenValueWrapper>
          <ValueInFiat secondary>{valueInFiatFormatted}</ValueInFiat>
        </ValuesWrapper>
        <DetailsWrapper>
          <ShadowedCard
            contentWrapperStyle={{
              padding: spacing.large,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <BaseText secondary fontSize={fontSizes.medium}>
              Earned
            </BaseText>
            <MediumText positive fontSize={fontSizes.medium}>
              + {formatAmountDisplay(earnedAmount)} {assetSymbol}
            </MediumText>
            <BaseText success fontSize={fontSizes.medium}>
              +{formatAmountDisplay(earningsPercentageGain)}%
            </BaseText>
          </ShadowedCard>
        </DetailsWrapper>
        <AssetButtonsWrapper>
          <CircleButton
            label="Add funds"
            fontIcon="plus"
            fontIconStyle={{ fontSize: fontSizes.big }}
            onPress={() => navigation.navigate(LENDING_ENTER_DEPOSIT_AMOUNT, { symbol: assetSymbol })}
          />
          <CircleButton
            label="Withdraw"
            fontIcon="up-arrow"
            fontIconStyle={{ fontSize: fontSizes.big }}
            onPress={() => navigation.navigate(LENDING_ENTER_WITHDRAW_AMOUNT, { symbol: assetSymbol })}
          />
        </AssetButtonsWrapper>
        {!isEmpty(activityFeedData) && (
          <ActivityFeed
            feedTitle="History"
            navigation={navigation}
            noBorder
            feedData={activityFeedData}
            isAssetView
          />
        )}
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  lending: { depositedAssets, isFetchingDepositedAssets },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
  accounts: { data: accounts },
  badges: { badgesEvents },
}: RootReducerState): $Shape<Props> => ({
  depositedAssets,
  isFetchingDepositedAssets,
  rates,
  baseFiatCurrency,
  accounts,
  badgesEvents,
});

const structuredSelector = createStructuredSelector({
  smartAccountHistory: smartAccountHistorySelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchDepositedAsset: (symbol: string) => dispatch(fetchDepositedAssetAction(symbol)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(ViewDepositedAsset);
