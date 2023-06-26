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
import { FlatList } from 'react-native';
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';
import { useNavigation, useNavigationParam } from 'react-navigation-hooks';
import moment from 'moment';

// Utils
import { fontStyles } from 'utils/variables';
import { useThemeColors, useIsDarkTheme } from 'utils/themes';
import { nFormatter, convertDecimalNumber } from 'utils/common';
import { fiatTokenValue } from 'utils/rates';

// Components
import Text from 'components/core/Text';
import Icon from 'components/core/Icon';
import { Spacing } from 'components/legacy/Layout';

// Selectors
import { useRatesPerChain, useFiatCurrency } from 'selectors';

// Constants
import { POOLS_ACTIVITY, TRADING_ACTIVITY } from 'constants/navigationConstants';

// Models
import type { AssetDataNavigationParam } from 'models/Asset';

// Local
import { AllTimeLoader, TokenAnalyticsLoader } from './Loaders';

const TokenAnalyticsListItem = ({ tokenRate, tokenDetails, marketDetails }) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const isDarkTheme = useIsDarkTheme();
  const navigation = useNavigation();
  const ratesPerChain = useRatesPerChain();
  const currency = useFiatCurrency();

  const assetData: AssetDataNavigationParam = useNavigationParam('assetData');

  const { data, isLoading } = marketDetails;
  const { data: tokenDetailsData, isLoading: tokenDetailsLoading } = tokenDetails;
  const { chain } = assetData;

  const analyticsList = [
    {
      label: t('label.marketCap'),
      value: data?.marketCap
        ? fiatTokenValue(data.marketCap, ratesPerChain[chain], currency, nFormatter)
        : t('label.notApplicable'),
    },
    {
      label: t('label.fdv'),
      value: data?.fullyDilutedValuation
        ? fiatTokenValue(data.fullyDilutedValuation, ratesPerChain[chain], currency, nFormatter)
        : t('label.notApplicable'),
      icon: 'info',
      iconPress: null,
    },
    {
      label: t('label.totalLiquidity'),
      value: tokenDetailsData?.liquidityUSD
        ? fiatTokenValue(tokenDetailsData.liquidityUSD, ratesPerChain[chain], currency, nFormatter)
        : t('label.notApplicable'),
      icon: 'history',
      percentageDifference: tokenDetailsData?.liquidityUSD ? tokenDetailsData?.liquidityUSDChangePercentage24h : null,
      iconPress: tokenDetailsLoading ? null : () => navigation.navigate(POOLS_ACTIVITY, { assetData, tokenDetails }),
    },
    {
      label: t('label.supply'),
      value: tokenDetailsData?.supply ? nFormatter(tokenDetailsData.supply) : t('label.notApplicable'),
    },
    {
      label: t('label.holders'),
      value: tokenDetailsData?.holders ? nFormatter(tokenDetailsData.holders) : t('label.notApplicable'),
    },
    {
      label: t('label.trandingVol'),
      value: tokenDetailsData?.tradingVolume
        ? fiatTokenValue(tokenDetailsData.tradingVolume, ratesPerChain[chain], currency, nFormatter)
        : t('label.notApplicable'),
      icon: 'history',
      percentageDifference: tokenDetailsData?.tradingVolume ? tokenDetailsData?.tradingVolumeChangePercentage : null,
      iconPress: tokenDetailsLoading ? null : () => navigation.navigate(TRADING_ACTIVITY, { assetData, tokenDetails }),
    },
  ];

  const renderItem = ({ item, index }) => {
    const loading = index === 1 || index === 0 ? isLoading : tokenDetailsLoading;
    const isLargePercentage = !!item?.percentageDifference && item.percentageDifference?.toFixed(2)?.length > 9;

    return (
      <ItemContainer
        key={item.label}
        isDark={isDarkTheme}
        disabled={index !== 2 && index !== 5}
        onPress={item?.iconPress}
        style={(index === 2 || index === 5) && [{ marginRight: 0, width: '39%' }]}
      >
        {loading ? (
          <TokenAnalyticsLoader />
        ) : (
          <RowContainer style={{ justifyContent: 'flex-start' }}>
            <Text variant="medium" color={colors.basic000} style={{ lineHeight: 22 }}>
              {item.value}
            </Text>
            <Spacing w={4} />
            {!!item?.percentageDifference && (
              <Text
                variant={isLargePercentage ? 'tiny' : 'small'}
                color={item.percentageDifference < 0 ? colors.negative : colors.positive}
                style={{ lineHeight: 22 }}
              >
                {item.percentageDifference > 0 && '+'}
                {item.percentageDifference?.toFixed(2)}%
              </Text>
            )}
          </RowContainer>
        )}

        <Spacing h={6} />
        <RowContainer>
          <LabelText>{item.label}</LabelText>
          {!!item?.icon && (
            <Button onPress={item.iconPress}>
              <Icon name={item.icon} width={16} height={16} />
            </Button>
          )}
        </RowContainer>
      </ItemContainer>
    );
  };

  const allTimeHigh = data?.allTimeHigh
    ? fiatTokenValue(data.allTimeHigh, ratesPerChain[chain], currency, convertDecimalNumber)
    : t('label.notApplicable');
  const allTimeLow = data?.allTimeLow
    ? fiatTokenValue(data.allTimeLow, ratesPerChain[chain], currency, convertDecimalNumber)
    : t('label.notApplicable');

  const allTimeHighPercentage =
    data?.allTimeHigh && !!tokenRate ? ((parseFloat(tokenRate) - data.allTimeHigh) * 100) / data.allTimeHigh : null;
  const allTimeLowPercentage =
    data?.allTimeLow && !!tokenRate ? ((parseFloat(tokenRate) - data.allTimeLow) * 100) / data.allTimeLow : null;

  return (
    <>
      <FlatList
        key={'token-analytics-list-item'}
        numColumns={3}
        data={analyticsList}
        renderItem={renderItem}
        scrollEnabled={false}
      />
      <Spacing h={18} />
      <RowContainer>
        <LabelText>{t('label.allTimeHigh')}</LabelText>
        {isLoading ? <AllTimeLoader /> : <LabelText>{allTimeHigh}</LabelText>}
      </RowContainer>
      {
        <RowContainer>
          {isLoading ? (
            <AllTimeLoader />
          ) : (
            data?.allTimeHighTimestamp && (
              <Text variant="tiny" color={colors.basic020}>
                {moment(data.allTimeHighTimestamp).format('YYYY, MMM DD HH:mm')}
              </Text>
            )
          )}
          {isLoading ? (
            <AllTimeLoader />
          ) : (
            allTimeHighPercentage && (
              <Text variant="tiny" color={data.allTimeHigh > tokenRate ? colors.negative : colors.positive}>
                {allTimeHighPercentage?.toFixed(2)}%
              </Text>
            )
          )}
        </RowContainer>
      }
      <Spacing h={10} />
      <RowContainer>
        <LabelText>{t('label.allTimeLow')}</LabelText>
        {isLoading ? <AllTimeLoader /> : <LabelText>{allTimeLow}</LabelText>}
      </RowContainer>
      {
        <RowContainer>
          {isLoading ? (
            <AllTimeLoader />
          ) : (
            data?.allTimeLowTimestamp &&
            !!data?.allTimeLow && (
              <Text variant="tiny" color={colors.basic020}>
                {moment(data.allTimeLowTimestamp).format('YYYY, MMM DD HH:mm')}
              </Text>
            )
          )}
          {isLoading ? (
            <AllTimeLoader />
          ) : (
            allTimeLowPercentage && (
              <Text variant="tiny" color={data.allTimeLow < tokenRate ? colors.positive : colors.negative}>
                +{allTimeLowPercentage?.toFixed(2)}%
              </Text>
            )
          )}
        </RowContainer>
      }
      <Spacing h={4} />
    </>
  );
};

export default TokenAnalyticsListItem;

const RowContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const LabelText = styled(Text)`
  ${fontStyles.small};
  color: ${({ theme, color }) => (color ? color : theme.colors.basic000)};
`;

const ItemContainer = styled.TouchableOpacity`
  width: 27%;
  margin-right: 12px;
  margin-vertical: 6px;
  padding: 12px 10px 14px 12px;
  border-radius: 10px;
  justify-content: space-between;
  background-color: ${({ theme, isDark }) => (isDark ? theme.colors.deepViolet : theme.colors.deepViolet + '10')};
`;

const Button = styled.TouchableOpacity``;
