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
import { FlatList } from 'react-native';
import isEmpty from 'lodash.isempty';
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';
import styled, { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';

import type { DepositedAsset } from 'models/Asset';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { BaseText } from 'components/Typography';
import CollapsibleSection from 'components/CollapsibleSection';
import { LENDING_DEPOSITED_ASSETS_LIST, LENDING_VIEW_DEPOSITED_ASSET } from 'constants/navigationConstants';
import { formatAmountDisplay, formatTokenAmount } from 'utils/common';
import { fontSizes } from 'utils/variables';

type Props = {
  depositedAssets: DepositedAsset[],
  isFetchingDepositedAssets: boolean,
  hideLendingDeposits: boolean,
  navigation: NavigationScreenProp<mixed>,
  toggleLendingDeposits: () => void,
}

const DepositedAssetGain = styled(BaseText)`
  margin-bottom: 5px;
  font-size: ${fontSizes.big}px;
`;

const aaveImage = require('assets/images/apps/aave.png');

const DepositedAssets = ({
  depositedAssets, isFetchingDepositedAssets, hideLendingDeposits, navigation, toggleLendingDeposits,
}: Props) => {
  if (isEmpty(depositedAssets)) return null;

  const renderDepositedAsset = ({ item: depositedAsset }: { item: DepositedAsset }) => {
    const {
      symbol,
      earnInterestRate,
      currentBalance,
      earnedAmount,
      earningsPercentageGain,
      iconUrl,
    } = depositedAsset;
    const cornerIcon = iconUrl ? { uri: `${getEnv().SDK_PROVIDER}/${iconUrl}?size=3` } : '';
    const displayedEarned = formatTokenAmount(earnedAmount, symbol);
    return (
      <ListItemWithImage
        label={t('tokenValue', { value: formatTokenAmount(currentBalance, symbol), token: symbol })}
        subtext={t('aaveContent.label.currentAPYPercentage', { rate: formatAmountDisplay(earnInterestRate) })}
        itemImageSource={aaveImage}
        onPress={() => navigation.navigate(LENDING_VIEW_DEPOSITED_ASSET, { depositedAsset })}
        iconImageSize={52}
        cornerIcon={cornerIcon}
        rightColumnInnerStyle={{ alignItems: 'flex-end' }}
        itemImageRoundedSquare
      >
        <DepositedAssetGain positive>
          {t('positiveTokenValue', {
              value: +displayedEarned ? displayedEarned : formatAmountDisplay(earnedAmount), token: symbol,
          })}
        </DepositedAssetGain>
        <BaseText secondary>
          {t('positivePercentValue', { value: formatAmountDisplay(earningsPercentageGain) })}
        </BaseText>
      </ListItemWithImage>
    );
  };

  return (
    <CollapsibleSection
      label={t('aaveContent.depositedAssetsList.title')}
      labelRight={isFetchingDepositedAssets ? null : t('button.viewAll')}
      showLoadingSpinner={isFetchingDepositedAssets}
      onPressLabelRight={() => { navigation.navigate(LENDING_DEPOSITED_ASSETS_LIST); }}
      collapseContent={
        <FlatList
          data={depositedAssets}
          keyExtractor={(item) => item.symbol}
          renderItem={renderDepositedAsset}
          initialNumToRender={5}
          listKey="aave_deposits"
        />
                      }
      onPress={toggleLendingDeposits}
      open={!hideLendingDeposits}
    />
  );
};

export default withTheme(DepositedAssets);
