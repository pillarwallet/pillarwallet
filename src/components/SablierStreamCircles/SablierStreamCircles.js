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
import { View } from 'react-native';
import styled from 'styled-components/native';
import t from 'translations/translate';

// components
import { MediumText } from 'components/Typography';
import CircularProgressBar from 'components/CircularProgressBar';
import { Spacing } from 'components/Layout';
import ShadowedCard from 'components/ShadowedCard';
import Icon from 'components/Icon';
import Image from 'components/Image';

// utils
import { getDeviceWidth, formatAmount, formatUnits, getDecimalPlaces, isCaseInsensitiveMatch } from 'utils/common';
import { getAssetDataByAddress, getAssetsAsList } from 'utils/assets';
import { themedColors, getThemeColors, useTheme } from 'utils/themes';
import { getWithdrawnProgress, getStreamProgress, getTotalStreamed, streamCountDownDHMS } from 'utils/sablier';
import { accountEthereumAssetsSelector } from 'selectors/assets';
import { activeAccountAddressSelector, useChainSupportedAssets, useRootSelector } from 'selectors';

// constants
import { CHAIN } from 'constants/chainConstants';

// types
import type { Stream } from 'models/Sablier';


type Props = {
  stream: Stream,
};

const screenWidth = getDeviceWidth();
const circlesMarginHorizontal = 20;
const circlesSize = screenWidth - (circlesMarginHorizontal * 2);
const circleWidth = 15;

const CirclesWrapper = styled.View`
  width: ${circlesSize}px;
  height: ${circlesSize}px;
  margin: 10px ${circlesMarginHorizontal}px 0;
  justify-content: center;
  align-items: center;
`;

const TokenIcon = styled(Image)`
  width: 49px;
  height: 49px;
`;

const RemainingTimeWrapper = styled.View`
  padding: 20px 0;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const ClockIcon = styled(Icon)`
  color: ${themedColors.labelTertiary};
  font-size: 20px;
`;

const SablierStreamCircles = ({ stream }: Props) => {
  const theme = useTheme();
  const activeAccountAddress = useRootSelector(activeAccountAddressSelector);
  const assets = useRootSelector(accountEthereumAssetsSelector);
  const ethereumSupportedAssets = useChainSupportedAssets(CHAIN.ETHEREUM);
  const colors = getThemeColors(theme);

  const assetData = getAssetDataByAddress(getAssetsAsList(assets), ethereumSupportedAssets, stream.token.id);
  const decimalPlaces = getDecimalPlaces(assetData.symbol);

  const streamProgress = getStreamProgress(stream);
  const totalStreamedAmount = getTotalStreamed(stream);
  const formattedStreamedAmount = formatAmount(formatUnits(totalStreamedAmount, assetData.decimals), decimalPlaces);

  const withdrawnProgress = getWithdrawnProgress(stream);

  const formattedDeposit = formatAmount(formatUnits(stream.deposit, assetData.decimals), decimalPlaces);

  const { days, hours, minutes } = streamCountDownDHMS(stream);

  const { iconUrl } = assetData;

  const isStreamCanceled = !!stream.cancellation;
  const isOutgoing = isCaseInsensitiveMatch(stream.sender, activeAccountAddress);

  return (
    <View>
      <CirclesWrapper>
        <CircularProgressBar
          size={circlesSize}
          circleWidth={circleWidth}
          progress={streamProgress}
          gradientStart={isStreamCanceled ? colors.labelTertiary : '#1469ff'}
          gradientEnd={isStreamCanceled ? colors.labelTertiary : '#0099ff'}
          style={{ position: 'absolute', top: 0, left: 0 }}
          backgroundAnimationDuration={9000}
          backgroundAnimation={!isStreamCanceled}
          border
        />
        {!isOutgoing && (
          <CircularProgressBar
            size={circlesSize - (4 * circleWidth)}
            circleWidth={circleWidth}
            progress={withdrawnProgress}
            style={{ position: 'absolute', top: 2 * circleWidth, left: 2 * circleWidth }}
            gradientStart="#f77423"
            gradientEnd="#fbce5b"
            backgroundAnimationDuration={7500}
            backgroundAnimation={!isStreamCanceled}
          />
        )}
        <TokenIcon source={{ uri: iconUrl }} />
        <Spacing h={20} />
        <MediumText giant color={isStreamCanceled ? colors.labelTertiary : colors.text}>
          {formattedStreamedAmount}
        </MediumText>
        <Spacing h={8} />
        <MediumText big color={isStreamCanceled ? colors.labelTertiary : colors.secondaryText}>
          {t('ofTotalTokenValue', { value: formattedDeposit, token: assetData.symbol })}
        </MediumText>
      </CirclesWrapper>
      <Spacing h={32} />
      <ShadowedCard borderRadius={8} wrapperStyle={{ paddingHorizontal: 20 }}>
        <RemainingTimeWrapper>
          <ClockIcon name="pending" />
          <Spacing w={10} />
          <MediumText fontSize={20} lineHeight={20}>
            {t('timeDaysHoursMinutesLayout', {
              days: t('day', { count: days }),
              hours: t('hour', { count: hours }),
              minutes: t('minute', { count: minutes }),
            })}
          </MediumText>
        </RemainingTimeWrapper>
      </ShadowedCard>
    </View>
  );
};


export default SablierStreamCircles;
