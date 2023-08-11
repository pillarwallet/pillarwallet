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

import React, { FC, useState, useEffect } from 'react';
import { Image } from 'react-native';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';
import { useNavigation } from 'react-navigation-hooks';
import { addDays, intervalToDuration } from 'date-fns';

// Constants
import { PILLAR_STAKING_FLOW } from 'constants/navigationConstants';
import { PLR_ICON_URL, STAKING_LOCKED_PERIOD, STAKING_PERIOD } from 'constants/plrStakingConstants';

// Utils
import { useTheme } from 'utils/themes';
import { borderRadiusSizes, fontStyles, spacing } from 'utils/variables';
import { images } from 'utils/images';
import { reportErrorLog } from 'utils/common';
import { formatRemainingTime, getStakingContractInfo, getStakingRemoteConfig } from 'utils/plrStakingHelper';

// Services
import { useAccounts } from 'selectors';

// Components
import Text from 'components/core/Text';
import TokenIcon from 'components/display/TokenIcon';
import { Spacing } from 'components/legacy/Layout';
import Icon from 'components/core/Icon';

type IPlrStakingBanner = {};

const PlrStakingBanner: FC<IPlrStakingBanner> = () => {
  const { t } = useTranslationWithPrefix('home.investments');

  const navigation = useNavigation();
  const theme = useTheme();
  const accounts = useAccounts();

  const [showBanner, setShowBanner] = useState(true);

  const [stakingEndTime, setStakingEndTime] = useState(null);
  const [stakingLockedEndTime, setStakingLockedEndTime] = useState<Date>(null);
  const [remainingStakingTime, setRemainingStakingTime] = useState<Duration>(null);
  const [remainingLockedTime, setRemainingLockedTime] = useState<Duration>(null);

  const [stakingEnabled, setStakingEnabled] = useState(false);

  useEffect(() => {
    if (!stakingEndTime) return;

    const timerCountdown = setInterval(getRemainingTimes, 1000);
    return () => clearInterval(timerCountdown);
  }, [stakingEndTime]);

  const getRemainingTimes = () => {
    if (stakingEndTime) {
      const stakingDuration = intervalToDuration({ start: new Date(), end: stakingEndTime });
      setRemainingStakingTime(stakingDuration);
    }

    if (stakingLockedEndTime) {
      const lockedDuration = intervalToDuration({ start: new Date(), end: stakingLockedEndTime });
      setRemainingLockedTime(lockedDuration);
    }
  };

  const onPlrStakingPress = () => {
    if (!stakingEnabled) return;

    navigation.navigate(PILLAR_STAKING_FLOW);
  };

  const getContractDetails = async () => {
    try {
      const remoteInfo = getStakingRemoteConfig();
      const stakingInfo = await getStakingContractInfo();
      if (!stakingInfo && !remoteInfo) return;

      const startTime = new Date(remoteInfo.stakingStartTime * 1000);
      const lockedStartTime = new Date(remoteInfo.stakingLockedStartTime * 1000);
      const endTime = addDays(startTime, STAKING_PERIOD);
      const lockedEndTime = addDays(lockedStartTime, STAKING_LOCKED_PERIOD);
      setStakingEndTime(endTime);
      setStakingLockedEndTime(lockedEndTime);

      const enabled = stakingInfo?.contractState === 1 && remoteInfo?.featureStaking;

      setStakingEnabled(enabled);
    } catch (e) {
      reportErrorLog('InvestSection error', e);
    }
  };

  useEffect(() => {
    getContractDetails();
  }, [accounts]);

  const hideBanner = () => {
    setShowBanner(false);
  };

  const { plrStakingBg } = images(theme);

  if (!showBanner) return null;

  return (
    <>
      <Spacing h={spacing.large} />

      <Container>
        <PlrStakingButton onPress={onPlrStakingPress}>
          <PlrTokenColumn>
            <TokenIcon url={PLR_ICON_URL} size={48} />
          </PlrTokenColumn>

          <PlrStakingDescColumn>
            <TextRow>
              <PlrStakingText>
                {`${t('stakingCloseTime')} `}
                <PlrStakingText bold>{formatRemainingTime(remainingStakingTime)}</PlrStakingText>
              </PlrStakingText>
            </TextRow>
          </PlrStakingDescColumn>

          <BackgroundImage source={plrStakingBg} resizeMode="contain" />
          <CloseButton onPress={hideBanner}>
            <Icon name="close" />
          </CloseButton>
        </PlrStakingButton>
      </Container>
    </>
  );
};

export default PlrStakingBanner;

const Container = styled.View`
  flex-direction: column;
  padding: 0 ${spacing.layoutSides}px;
`;

// PLR Staking
const PlrStakingButton = styled.TouchableOpacity`
  display: flex;
  flex-direction: row;
  background-color: ${({ theme }) => theme.colors.plrStaking};
  padding: ${spacing.mediumLarge}px;
  padding-right: 40px;
  border-radius: ${borderRadiusSizes.defaultContainer}px;
  overflow: hidden;
`;

const PlrTokenColumn = styled.View``;

const PlrStakingDescColumn = styled.View`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-left: ${spacing.small}px;
`;

const TextRow = styled.View`
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const PlrStakingText = styled(Text)<{ bold?: boolean }>`
  ${fontStyles.regular};
  color: ${({ theme }) => theme.colors.basic000};
  ${({ bold }) => bold && `font-weight: 500;`};
`;

const BackgroundImage = styled(Image)`
  width: 200px;
  height: 600px;
  position: absolute;
  top: -200px;
  right: -50px;
`;

const CloseButton = styled.TouchableOpacity`
  position: absolute;
  top: 0;
  right: 0;
  padding: 12px;
`;
