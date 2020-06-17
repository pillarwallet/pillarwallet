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
import styled, { withTheme } from 'styled-components/native';

import { DAI } from 'constants/assetsConstants';

import ShadowedCard from 'components/ShadowedCard';
import { BaseText } from 'components/Typography';
import Progress from 'components/Progress';

import type { Theme } from 'models/Theme';

import { getThemeColors, themedColors } from 'utils/themes';
import { countDownDHMS } from 'utils/common';
import { fontStyles } from 'utils/variables';
import { Image } from 'react-native';

const CardRow = styled.View`
  flex-direction: row;
  width: 100%;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  ${({ withBorder, theme }) => withBorder
    ? `border-bottom-width: 1px;
     border-bottom-color: ${theme.colors.border};`
    : ''}
`;

const CardColumn = styled.View`
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  ${({ withBorder, theme }) => withBorder
    ? `border-right-width: 1px;
       border-right-color: ${theme.colors.border};`
    : ''}
`;

const CardText = styled(BaseText)`
  ${({ label }) => label ? fontStyles.regular : fontStyles.large};
  letter-spacing: 0.18px;
  color: ${({ label }) => label ? themedColors.secondaryText : themedColors.text};
`;

type Props = {
  name: string,
  currentPrize: string,
  prizeEstimate: string,
  remainingTimeMs: number,
  activeTab: string,
  theme: Theme,
};

const daiIcon = require('assets/images/dai_color.png');
const usdcIcon = require('assets/images/usdc_color.png');

const PoolCard = (props: Props) => {
  const {
    currentPrize,
    prizeEstimate,
    remainingTimeMs = 0,
    activeTab: symbol,
    theme,
  } = props;

  const colors = getThemeColors(theme);

  const { days, hours, minutes } = countDownDHMS(remainingTimeMs);

  const iconSrc = symbol === DAI ? daiIcon : usdcIcon;

  return (
    <ShadowedCard
      wrapperStyle={{
          marginTop: 8,
          marginBottom: 10,
          paddingHorizontal: 16,
        }}
      contentWrapperStyle={{ paddingLeft: 20, paddingRight: 40 }}
    >
      <CardRow>
        <CardColumn withBorder>
          <CardRow>
            <CardText label>Prize est.</CardText>
          </CardRow>
          <CardRow>
            <CardText>${prizeEstimate}</CardText>
            <Image
              source={iconSrc}
              style={{
                margin: 5,
                height: 24,
                width: 24,
              }}
            />
          </CardRow>
        </CardColumn>
        <CardColumn>
          <CardRow>
            <CardText label>Current prize</CardText>
          </CardRow>
          <CardRow>
            <CardText style={{ color: colors.poolTogetherPink }}>${currentPrize}</CardText>
          </CardRow>
        </CardColumn>
      </CardRow>
      <CardRow style={{ width: '100%' }}>
        <Progress
          fullStatusValue={prizeEstimate}
          currentStatusValue={currentPrize}
          activeTab={symbol}
        />
      </CardRow>
      <CardRow style={{ paddingBottom: 16 }}>
        <CardText label>Ends in {days} days, {hours} hours, {minutes} minutes</CardText>
      </CardRow>
    </ShadowedCard>
  );
};

export default withTheme(PoolCard);
