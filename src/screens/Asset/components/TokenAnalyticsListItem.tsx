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

// Utils
import { fontStyles } from 'utils/variables';
import { useThemeColors, useIsDarkTheme } from 'utils/themes';
import { getCurrencySymbol, nFormatter, convertDecimalNumber } from 'utils/common';

// Components
import Text from 'components/core/Text';
import Icon from 'components/core/Icon';
import { Spacing } from 'components/legacy/Layout';

// Constants
import { USD } from 'constants/assetsConstants';
import { POOLS_ACTIVITY, TRADING_ACTIVITY } from 'constants/navigationConstants';

// Models
import type { AssetDataNavigationParam } from 'models/Asset';

// Local
import { AllTimeLoader, TokenAnalyticsLoader } from './Loaders';

const TokenAnalyticsListItem = ({ tokenRate, tokenDetails, marketDetails }) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const currencySymbol = getCurrencySymbol(USD);
  const isDarkTheme = useIsDarkTheme();
  const navigation = useNavigation();

  const assetData: AssetDataNavigationParam = useNavigationParam('assetData');

  const { data, isLoading } = marketDetails;
  const { data: tokenDetailsData, isLoading: tokenDetailsLoading } = tokenDetails;

  const analyticsList = [
    {
      label: t('label.marketCap'),
      value: data?.marketCap ? `${currencySymbol + nFormatter(data.marketCap)}` : t('label.notApplicable'),
    },
    {
      label: t('label.fdv'),
      value: data?.fullyDilutedValuation
        ? `${currencySymbol + nFormatter(data.fullyDilutedValuation)}`
        : t('label.notApplicable'),
      icon: 'info',
      iconPress: null,
    },
    {
      label: t('label.totalLiquidity'),
      value: tokenDetailsData?.liquidityUSD
        ? `${currencySymbol + nFormatter(tokenDetailsData.liquidityUSD)}`
        : t('label.notApplicable'),
      icon: 'history',
      iconPress: tokenDetailsLoading ? null : () => navigation.navigate(POOLS_ACTIVITY, { assetData, tokenDetails }),
    },
    { label: t('label.supply'), value: t('label.notApplicable') },
    { label: t('label.holders'), value: t('label.notApplicable') },
    {
      label: t('label.trandingVol'),
      value: tokenDetailsData?.tradingVolume ? nFormatter(tokenDetailsData.tradingVolume) : t('label.notApplicable'),
      icon: 'history',
      iconPress: tokenDetailsLoading ? null : () => navigation.navigate(TRADING_ACTIVITY, { assetData, tokenDetails }),
    },
  ];

  const renderItem = ({ item, index }) => {
    return (
      <ItemContainer
        key={item.label}
        isDark={isDarkTheme}
        style={(index === 2 || index === 5) && [{ marginRight: 0, width: '39%' }]}
      >
        {isLoading ? (
          <TokenAnalyticsLoader />
        ) : (
          <RowContainer style={{ justifyContent: 'flex-start' }}>
            <Text variant="medium" color={colors.basic000} style={{ lineHeight: 22 }}>
              {item.value}
            </Text>
            <Spacing w={4} />
            {item?.percentageDifference && (
              <Text variant="small" color={index === 5 ? colors.negative : colors.positive} style={{ lineHeight: 22 }}>
                {item.percentageDifference}
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
        {isLoading ? (
          <AllTimeLoader />
        ) : (
          <LabelText color={colors.basic000}>
            {data?.allTimeHigh
              ? `${currencySymbol + convertDecimalNumber(data.allTimeHigh)}`
              : t('label.notApplicable')}
          </LabelText>
        )}
      </RowContainer>
      {allTimeHighPercentage && (
        <RowContainer>
          <LabelText />
          {isLoading ? (
            <AllTimeLoader />
          ) : (
            <Text variant="tiny" color={data.allTimeHigh > tokenRate ? colors.negative : colors.positive}>
              {allTimeHighPercentage?.toFixed(2)}%
            </Text>
          )}
        </RowContainer>
      )}
      <Spacing h={10} />
      <RowContainer>
        <LabelText>{t('label.allTimeLow')}</LabelText>
        {isLoading ? (
          <AllTimeLoader />
        ) : (
          <LabelText color={colors.basic000}>
            {data?.allTimeLow ? `${currencySymbol + convertDecimalNumber(data.allTimeLow)}` : t('label.notApplicable')}
          </LabelText>
        )}
      </RowContainer>
      {allTimeLowPercentage && (
        <RowContainer>
          <LabelText />
          {isLoading ? (
            <AllTimeLoader />
          ) : (
            <Text variant="tiny" color={data.allTimeLow < tokenRate ? colors.positive : colors.negative}>
              +{allTimeLowPercentage?.toFixed(2)}%
            </Text>
          )}
        </RowContainer>
      )}
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
  color: ${({ theme, color }) => (color ? color : theme.colors.basic010)};
`;

const ItemContainer = styled.View`
  width: 27%;
  margin-right: 12px;
  margin-vertical: 6px;
  padding: 12px 10px 14px 12px;
  border-radius: 10px;
  background-color: ${({ theme, isDark }) => (isDark ? theme.colors.deepViolet : theme.colors.deepViolet + '10')};
`;

const Button = styled.TouchableOpacity``;
