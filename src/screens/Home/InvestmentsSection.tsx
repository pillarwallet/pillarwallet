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
import { useNavigation } from '@react-navigation/native';
import { BigNumber } from 'ethers';
import { addDays, intervalToDuration } from 'date-fns';

// Constants
import { PILLAR_STAKING_FLOW } from 'constants/navigationConstants';
import { PLR_ICON_URL, STAKING_LOCKED_PERIOD, STAKING_PERIOD } from 'constants/plrStakingConstants';
import { CHAIN } from 'constants/chainConstantsTs';
import { ASSET_CATEGORY } from 'constants/assetsConstants';

// Utils
import { useTheme } from 'utils/themes';
import { appFont, borderRadiusSizes, fontStyles, spacing } from 'utils/variables';
import { useAssetCategoriesConfig } from 'utils/uiConfig';
import { images } from 'utils/images';
import { reportErrorLog } from 'utils/common';
import {
  formatRemainingTime,
  getStakingApy,
  getStakingContractInfo,
  getStakingRemoteConfig,
} from 'utils/plrStakingHelper';

// Services
import { useAccounts } from 'selectors';

// Components
import Text from 'components/core/Text';
import TokenIcon from 'components/display/TokenIcon';
import CategoryListItem from './components/CategoryListItem';

// Types
import type { Theme, ColorsByThemeProps } from 'models/Theme';

type IInvestmentsSection = {};

const InvestmentsSection: FC<IInvestmentsSection> = () => {
  const { t } = useTranslationWithPrefix('home.investments');
  const { t: tStaking } = useTranslationWithPrefix('plrStaking');

  const navigation = useNavigation();
  const theme: Theme = useTheme();
  const accounts = useAccounts();


  console.log('====================================');
  console.log('theme', theme);
  console.log('====================================');

  const category = ASSET_CATEGORY.INVESTMENTS;
  const categoriesConfig = useAssetCategoriesConfig();
  const categoryInfo = categoriesConfig[category];

  const [stakingEndTime, setStakingEndTime] = useState(null);
  const [stakingLockedEndTime, setStakingLockedEndTime] = useState<Date>(null);
  const [remainingStakingTime, setRemainingStakingTime] = useState<Duration>(null);
  const [remainingLockedTime, setRemainingLockedTime] = useState<Duration>(null);

  const [stakingEnabled, setStakingEnabled] = useState(false);
  const [stakedPercentage, setStakedPercentage] = useState(null);
  const [stakingApy, setStakingApy] = useState<string>(null);

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
    const apy = await getStakingApy();
    setStakingApy(apy);

    try {
      const remoteInfo = getStakingRemoteConfig();
      const stakingInfo = await getStakingContractInfo();
      if (!stakingInfo || !remoteInfo) return;

      const startTime = new Date(remoteInfo.stakingStartTime * 1000);
      const lockedStartTime = new Date(remoteInfo.stakingLockedStartTime * 1000);
      const endTime = addDays(startTime, STAKING_PERIOD);
      const lockedEndTime = addDays(lockedStartTime, STAKING_LOCKED_PERIOD);
      setStakingEndTime(endTime);
      setStakingLockedEndTime(lockedEndTime);

      const enabled = stakingInfo?.contractState === 1 && remoteInfo?.featureStaking;
      const stakingMaxTotal = BigNumber.from(stakingInfo?.maxStakeTotal.toString());
      const totalStaked = BigNumber.from(stakingInfo?.totalStaked.toString());
      const percentage = Number(totalStaked.mul(100).div(stakingMaxTotal)) / 100;

      setStakedPercentage(percentage);
      setStakingEnabled(enabled);
    } catch (e) {
      reportErrorLog('InvestSection error', e);
    }
  };

  useEffect(() => {
    getContractDetails();
  }, [accounts]);

  const { plrStakingBg } = images(theme);

  if (!stakingEnabled) return null;

  return (
    <>
      <Container>
        <SubContainer>
          <CategoryListItem key={category} iconName={'home-investments'} title={categoryInfo.title} />
        </SubContainer>

        <PlrStakingButton onPress={onPlrStakingPress}>
          <PlrTokenColumn>
            <TokenIcon url={PLR_ICON_URL} size={48} chain={CHAIN.ETHEREUM} />
          </PlrTokenColumn>

          <PlrStakingDescColumn>
            <TitleRow>
              <PlrStakingTitle>{t('title')}</PlrStakingTitle>
              <PlrStakingTitle>{`${t('apy')} ${stakingApy || '0%'}`}</PlrStakingTitle>
            </TitleRow>

            <TextRow>
              <PlrStakingText>{t('description', { stakedPercentage: stakedPercentage || '0' })}</PlrStakingText>
            </TextRow>

            {stakingEndTime && (
              <TextRow>
                <StakingAlertCircle />

                <PlrStakingText>{`${tStaking('stakingClosingIn')} `}</PlrStakingText>
                <PlrStakingText bold>{formatRemainingTime(remainingStakingTime)}</PlrStakingText>
              </TextRow>
            )}
          </PlrStakingDescColumn>

          <BackgroundImage source={plrStakingBg} resizeMode="contain" />
        </PlrStakingButton>
      </Container>
    </>
  );
};

export default InvestmentsSection;

const Container = styled.View`
  flex-direction: column;
  padding: 0 ${spacing.layoutSides}px;
  height: 80px;
  background-color: blue;
`;

const SubContainer = styled.View`
  padding: 0 4px;
`;

// PLR Staking
const PlrStakingButton = styled.TouchableOpacity`
  display: flex;
  flex-direction: row;
  background-color: ${({ theme }) => theme.colors.plrStaking};
  padding: ${spacing.mediumLarge}px;
  border-radius: ${borderRadiusSizes.defaultContainer}px;
  overflow: hidden;
`;

const PlrTokenColumn = styled.View``;

const PlrStakingDescColumn = styled.View`
  display: flex;
  flex: 1;
  flex-direction: column;
  padding-left: ${spacing.small}px;
`;

const TitleRow = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const TextRow = styled.View`
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: ${spacing.small}px;
`;

const StakingAlertCircle = styled.View`
  width: 12px;
  height: 12px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.colors.plrStakingAlert};

  position: absolute;
  left: -${spacing.small + 12}px;
`;

const PlrStakingTitle = styled(Text)`
  ${fontStyles.big};
  font-family: ${appFont.medium};
  color: ${({ theme }) => theme.colors.basic000};
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
  top: -135px;
  right: -50px;
`;
