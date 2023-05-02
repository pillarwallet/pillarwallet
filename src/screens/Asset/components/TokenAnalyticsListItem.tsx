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

// Utils
import { fontStyles } from 'utils/variables';
import { useThemeColors } from 'utils/themes';

// Components
import Text from 'components/core/Text';
import Icon from 'components/core/Icon';
import { Spacing } from 'components/legacy/Layout';

// Local
import { AllTimeLoader, TokenAnalyticsLoader } from './Loaders';

const TokenAnalyticsListItem = ({ isLoading }) => {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const analyticsList = [
    { label: t('label.marketCap'), value: '$79,9B' },
    { label: t('label.fdv'), value: '$1,09B', icon: 'info' },
    { label: t('label.totalLiquidity'), value: '$347K', icon: 'history', percentageDifference: '+1.24%' },
    { label: t('label.supply'), value: '259.3M' },
    { label: t('label.holders'), value: '1,40K' },
    { label: t('label.trandingVol'), value: '$867', icon: 'history', percentageDifference: '-0.24%' },
  ];

  const renderItem = ({ item, index }) => {
    return (
      <ItemContainer key={item.label} style={(index === 2 || index === 5) && [{ marginRight: 0, width: '40%' }]}>
        {isLoading ? (
          <TokenAnalyticsLoader />
        ) : (
          <RowContainer style={{ justifyContent: 'flex-start' }}>
            <Text variant="medium" color={colors.basic000} style={{ lineHeight: 22 }}>
              {item.value}
            </Text>
            <Spacing w={4} />
            {item?.percentageDifference && (
              <Text
                variant="small"
                color={index === 5 ? colors.negative : colors.caribbeanGreen}
                style={{ lineHeight: 22 }}
              >
                {item.percentageDifference}
              </Text>
            )}
          </RowContainer>
        )}

        <Spacing h={6} />
        <RowContainer>
          <LabelText>{item.label}</LabelText>
          {!!item?.icon && (
            <Button>
              <Icon name={item.icon} width={16} height={16} />
            </Button>
          )}
        </RowContainer>
      </ItemContainer>
    );
  };

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
        {/* <AllTimeLoader /> */}
        <LabelText color={colors.basic000}>$1.5</LabelText>
      </RowContainer>
      <Spacing h={4} />
      <RowContainer>
        <SmallText>2023, Jul 26 13:45</SmallText>
        {isLoading ? <AllTimeLoader /> : <SmallText color={colors.negative}>-57.22%</SmallText>}
      </RowContainer>
      <Spacing h={10} />
      <RowContainer>
        <LabelText>{t('label.allTimeLow')}</LabelText>
        {isLoading ? <AllTimeLoader /> : <LabelText color={colors.basic000}>$1.5</LabelText>}
      </RowContainer>
      <Spacing h={4} />
      <RowContainer>
        <SmallText>2023, Jul 26 13:45</SmallText>
        {isLoading ? <AllTimeLoader /> : <SmallText color={colors.caribbeanGreen}>+3454.65%</SmallText>}
      </RowContainer>
    </>
  );
};

const TAG = 'token-analytics-list-item';

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

const SmallText = styled(Text)`
  ${fontStyles.tiny};
  color: ${({ theme, color }) => (color ? color : theme.colors.basic020)};
`;

const ItemContainer = styled.View`
  width: 27%;
  margin-right: 12px;
  margin-vertical: 6px;
  padding: 12px 10px 14px 12px;
  border-radius: 10px;
  background-color: ${({ theme }) => theme.colors.deepViolet};
`;

const Button = styled.TouchableOpacity``;
