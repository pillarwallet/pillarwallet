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

import React, { useEffect, useState } from 'react';
import styled, { withTheme } from 'styled-components/native';
import { connect } from 'react-redux';
import { CachedImage } from 'react-native-cached-image';
import { RefreshControl } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText } from 'components/Typography';
import { Spacing, ScrollWrapper } from 'components/Layout';
import CircleButton from 'components/CircleButton';
import BalanceView from 'components/PortfolioBalance/BalanceView';
import Tabs from 'components/Tabs';
import Table, { TableRow, TableLabel } from 'components/Table';
import RetryGraphQueryBox from 'components/RetryGraphQueryBox';

import { getThemeColors, themedColors } from 'utils/themes';
import { formatFiat } from 'utils/common';
import { convertUSDToFiat } from 'utils/assets';

import { defaultFiatCurrency } from 'constants/assetsConstants';
import { RARI_INFO, RARI_ADD_DEPOSIT, RARI_WITHDRAW, RARI_TRANSFER } from 'constants/navigationConstants';
import { RARI_POOLS } from 'constants/rariConstants';

import { fetchRariDataAction } from 'actions/rariActions';

import type { Theme } from 'models/Theme';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { Rates } from 'models/Asset';
import type { RariPool, Interests } from 'models/RariPool';


type Props = {
  theme: Theme,
  baseFiatCurrency: ?string,
  navigation: NavigationScreenProp<*>,
  fetchRariData: () => void,
  rariApy: {[RariPool]: number},
  userDepositInUSD: {[RariPool]: number},
  userInterests: {[RariPool]: ?Interests},
  isFetchingRariData: boolean,
  rariDataFetchFailed: boolean,
  rates: Rates,
};

const rariLogo = require('assets/images/rari_logo.png');

const MainContainer = styled.View`
  padding: 16px 20px;
`;

const EarnedCard = styled.View`
  background-color: ${themedColors.card};
  padding: 20px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-radius: 4px;
`;

const ButtonsContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
`;

const RariLogo = styled(CachedImage)`
  width: 64px;
  height: 64px;
  align-self: center;
`;

const PoolContainer = styled.View`

`;

const RariDepositScreen = ({
  baseFiatCurrency, theme, navigation, fetchRariData,
  rariApy,
  userDepositInUSD,
  userInterests,
  isFetchingRariData,
  rariDataFetchFailed,
  rates,
}: Props) => {
  const [activeTab, setActiveTab] = useState(RARI_POOLS.STABLE_POOL);

  useEffect(() => {
    fetchRariData();
  }, []);

  const colors = getThemeColors(theme);
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

  const totalUserInterests = (Object.values(userInterests): any[])
    .map(pool => pool?.interests ?? 0)
    .reduce((sum, interests) => sum + interests, 0);
  const summedUserDepositsInUSD = (Object.values(userDepositInUSD): any).reduce((sum, v) => sum + v, 0);
  const totalInterestsPercentage =
    ((summedUserDepositsInUSD / (summedUserDepositsInUSD - totalUserInterests)) - 1) * 100;

  const tabs = [
    {
      id: RARI_POOLS.STABLE_POOL,
      name: t('rariContent.tabs.stablePool'),
      onPress: () => setActiveTab(RARI_POOLS.STABLE_POOL),
    },
    {
      id: RARI_POOLS.YIELD_POOL,
      name: t('rariContent.tabs.yieldPool'),
      onPress: () => setActiveTab(RARI_POOLS.YIELD_POOL),
    },
    {
      id: RARI_POOLS.ETH_POOL,
      name: t('rariContent.tabs.ethPool'),
      onPress: () => setActiveTab(RARI_POOLS.ETH_POOL),
    },
  ];

  const renderEmptyDepositSection = () => {
    return (
      <CircleButton
        label={t('rariContent.button.deposit')}
        fontIcon="plus"
        onPress={() => navigation.navigate(RARI_ADD_DEPOSIT, { rariPool: activeTab })}
      />
    );
  };

  const renderDepositSection = () => {
    return (
      <>
        <Spacing h={32} />
        <BaseText regular secondary center>{t('rariContent.label.poolBalance')}</BaseText>
        <Spacing h={4} />
        <BalanceView
          fiatCurrency={fiatCurrency}
          balance={convertUSDToFiat(userDepositInUSD[activeTab], rates, fiatCurrency)}
          currencyTextStyle={{ fontSize: 16, lineHeight: 16 }}
          balanceTextStyle={{ fontSize: 24, lineHeight: 24 }}
        />
        <Spacing h={60} />
        <ButtonsContainer>
          <CircleButton
            label={t('rariContent.button.withdraw')}
            fontIcon="back"
            fontIconStyle={{ transform: [{ rotate: '90deg' }] }}
            onPress={() => navigation.navigate(RARI_WITHDRAW, { rariPool: activeTab })}
          />
          <CircleButton
            label={t('rariContent.button.deposit')}
            fontIcon="plus"
            onPress={() => navigation.navigate(RARI_ADD_DEPOSIT, { rariPool: activeTab })}
          />
          <CircleButton
            label={t('rariContent.button.transfer')}
            fontIcon="back"
            fontIconStyle={{ transform: [{ rotate: '180deg' }] }}
            onPress={() => navigation.navigate(RARI_TRANSFER, { rariPool: activeTab })}
          />
        </ButtonsContainer>
      </>
    );
  };

  const renderEarnedInterests = (interestsInUSD: number) => {
    const interestsInUserCurrency = convertUSDToFiat(Math.abs(interestsInUSD), rates, fiatCurrency);
    const formattedFiatValue = formatFiat(interestsInUserCurrency, fiatCurrency);
    let earnedFiatTranslation = formattedFiatValue;

    if (interestsInUSD > 0) {
      earnedFiatTranslation = t('positiveValue', { value: formattedFiatValue });
    } else if (interestsInUSD < 0) {
      earnedFiatTranslation = t('negativeValue', { value: formattedFiatValue });
    }

    return (
      <BaseText regular>{earnedFiatTranslation}</BaseText>
    );
  };

  const renderEarnedInterestsPercent = (interestsPercentage: number) => {
    const formattedInterestsPercentage = Math.abs(interestsPercentage).toFixed(2);
    let earnedPercentTranslation = t('percentValue', { value: formattedInterestsPercentage });
    let earnedPercentColor = colors.text;

    if (interestsPercentage > 0) {
      earnedPercentTranslation = t('positivePercentValue', { value: formattedInterestsPercentage });
      earnedPercentColor = colors.positive;
    } else if (interestsPercentage < 0) {
      earnedPercentTranslation = t('negativePercentValue', { value: formattedInterestsPercentage });
      earnedPercentColor = colors.negative;
    }

    return (
      <BaseText color={earnedPercentColor} regular>{earnedPercentTranslation}</BaseText>
    );
  };

  const renderInterestsRow = () => {
    const currentPoolUserInterests = userInterests[activeTab];
    if (!currentPoolUserInterests) return null;
    const { interests, interestsPercentage } = currentPoolUserInterests;
    return (
      <TableRow>
        <TableLabel>{t('rariContent.label.earned')}</TableLabel>
        <BaseText regular>
          {renderEarnedInterests(interests)}{' '}
          {renderEarnedInterestsPercent(interestsPercentage)}
        </BaseText>
      </TableRow>
    );
  };

  const renderTab = () => {
    const hasDeposit = userDepositInUSD[activeTab] > 0;

    return (
      <PoolContainer>
        <Spacing h={34} />
        <Table>
          <TableRow>
            <TableLabel>{t('rariContent.label.currentAPY')}</TableLabel>
            <BaseText regular>{t('percentValue', { value: rariApy[activeTab].toFixed(2) })}</BaseText>
          </TableRow>
          {hasDeposit && renderInterestsRow()}
        </Table>
        {hasDeposit ? renderDepositSection() : renderEmptyDepositSection()}
      </PoolContainer>
    );
  };

  return (
    <ContainerWithHeader
      inset={{ bottom: 'never' }}
      headerProps={{
        centerItems: [{ title: t('rariContent.title.depositScreen') }],
        rightItems: [
          {
            icon: 'info-circle-inverse',
            color: colors.labelTertiary,
            onPress: () => navigation.navigate(RARI_INFO),
          },
        ],
      }}
    >
      <ScrollWrapper
        refreshControl={
          <RefreshControl
            refreshing={isFetchingRariData}
            onRefresh={fetchRariData}
          />
        }
      >
        <MainContainer>
          <Spacing h={32} />
          <RariLogo source={rariLogo} />
          <Spacing h={32} />
          <BalanceView
            fiatCurrency={fiatCurrency}
            balance={convertUSDToFiat(summedUserDepositsInUSD, rates, fiatCurrency)}
          />
          <Spacing h={58} />
          {summedUserDepositsInUSD > 0 && (
            <EarnedCard>
              <BaseText secondary regular>{t('rariContent.label.earned')}</BaseText>
              {renderEarnedInterests(summedUserDepositsInUSD)}
              {renderEarnedInterestsPercent(totalInterestsPercentage)}
            </EarnedCard>
          )}
          <Spacing h={60} />
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
          />
          {renderTab()}
        </MainContainer>
      </ScrollWrapper>
      <RetryGraphQueryBox
        message={t('error.theGraphQueryFailed.rari')}
        hasFailed={rariDataFetchFailed}
        isFetching={isFetchingRariData}
        onRetry={fetchRariData}
      />
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
  rari: {
    rariApy,
    userDepositInUSD,
    userInterests,
    isFetchingRariData,
    rariDataFetchFailed,
  },
  rates: { data: rates },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  rariApy,
  userDepositInUSD,
  userInterests,
  isFetchingRariData,
  rariDataFetchFailed,
  rates,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  fetchRariData: () => dispatch(fetchRariDataAction()),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(RariDepositScreen));
