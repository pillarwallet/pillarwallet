// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project
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
import { useNavigation } from 'react-navigation-hooks';
import styled, { useTheme } from 'styled-components/native';
import t from 'translations/translate';

// components
import { BaseText } from 'components/Typography';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';

// constants
import { RARI_DEPOSIT } from 'constants/navigationConstants';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { RARI_POOLS } from 'constants/rariConstants';

// selectors
import { useBaseFiatCurrency } from 'selectors/appSettings';
import { useRariSelector } from 'selectors/rari';

// services
import { usePoolCurrentApy } from 'services/rariSdk';

// utils
import { fontSizes } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import { formatFiat, formatApy } from 'utils/common';

// types
import type { RariPool } from 'models/RariPool';

const rariLogo = require('assets/images/rari_logo.png');

const DepositedAssetGain = styled(BaseText)`
  margin-bottom: 5px;
  font-size: ${fontSizes.big}px;
`;

type Props = {|
  pool: RariPool,
  balanceInUSD: number,
|};

const RariPoolItem = ({ pool, balanceInUSD }: Props) => {
  const navigation = useNavigation();
  const theme = useTheme();
  const colors = getThemeColors(theme);

  const baseFiatCurrency = useBaseFiatCurrency();
  const rariUserInterests = useRariSelector((state) => state.userInterests);

  const apyQuery = usePoolCurrentApy(pool);

  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const poolsLabels = {
    [RARI_POOLS.STABLE_POOL]: t('rariContent.depositsList.stablePool'),
    [RARI_POOLS.YIELD_POOL]: t('rariContent.depositsList.yieldPool'),
    [RARI_POOLS.ETH_POOL]: t('rariContent.depositsList.ethPool'),
  };

  const renderEarnedInterestsPercent = (interestsPercentage: number) => {
    const formattedInterestsPercentage = Math.abs(interestsPercentage).toFixed(2);
    let earnedPercentTranslation = t('percentValue', { value: formattedInterestsPercentage });
    let earnedPercentColor = colors.basic10;

    if (interestsPercentage > 0) {
      earnedPercentTranslation = t('positivePercentValue', { value: formattedInterestsPercentage });
      earnedPercentColor = colors.secondaryAccent140;
    } else if (interestsPercentage < 0) {
      earnedPercentTranslation = t('negativePercentValue', { value: formattedInterestsPercentage });
      earnedPercentColor = colors.secondaryAccent240;
    }

    return (
      <BaseText color={earnedPercentColor} regular>{earnedPercentTranslation}</BaseText>
    );
  };

  return (
    <ListItemWithImage
      label={poolsLabels[pool]}
      subtext={t('rariContent.label.currentAPYWithValue', {
        value: formatApy(apyQuery.data),
      })}
      itemImageSource={rariLogo}
      onPress={() => navigation.navigate(RARI_DEPOSIT)}
      iconImageSize={48}
      rightColumnInnerStyle={{ alignItems: 'flex-end' }}
    >
      <DepositedAssetGain>{formatFiat(balanceInUSD, fiatCurrency)}</DepositedAssetGain>
      {renderEarnedInterestsPercent(rariUserInterests[pool]?.interestsPercentage ?? 0)}
    </ListItemWithImage>
  );
};

export default RariPoolItem;
