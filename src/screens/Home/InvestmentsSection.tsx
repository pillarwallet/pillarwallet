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
import { BigNumber } from 'ethers';

// Constants
import { PILLAR_STAKING_FLOW } from 'constants/navigationConstants';
import { PLR_ICON_URL } from 'constants/plrStakingConstants';
import { CHAIN } from 'constants/chainConstantsTs';
import { ASSET_CATEGORY } from 'constants/assetsConstants';

// Utils
import { useTheme } from 'utils/themes';
import { appFont, borderRadiusSizes, fontStyles, spacing } from 'utils/variables';
import { useAssetCategoriesConfig } from 'utils/uiConfig';
import { images } from 'utils/images';
import { reportErrorLog } from 'utils/common';
import { getStakingApy, getStakingContractInfo, getStakingRemoteConfig } from 'utils/plrStakingHelper';

// Services
import { useAccounts } from 'selectors';

// Components
import Text from 'components/core/Text';
import TokenIcon from 'components/display/TokenIcon';
import CategoryListItem from './components/CategoryListItem';

type IInvestmentsSection = {};

const InvestmentsSection: FC<IInvestmentsSection> = () => {
  const { t, tRoot } = useTranslationWithPrefix('home.investments');
  const navigation = useNavigation();
  const theme = useTheme();
  const accounts = useAccounts();

  const category = ASSET_CATEGORY.INVESTMENTS;
  const categoriesConfig = useAssetCategoriesConfig();
  const categoryInfo = categoriesConfig[category];

  const [stakingEnabled, setStakingEnabled] = useState(false);
  const [stakingEndTime, setStakingEndTime] = useState(null);
  const [stakedPercentage, setStakedPercentage] = useState(null);
  const [stakingApy, setStakingApy] = useState<string>(null);

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
      if (!stakingInfo && !remoteInfo) return;

      const enabled = stakingInfo?.contractState === 1 && remoteInfo?.featureStaking;
      const stakingMaxTotal = BigNumber.from(stakingInfo.maxStakeTotal.toString());
      const totalStaked = BigNumber.from(stakingInfo.totalStaked.toString());
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
            <PlrStakingText>{t('description', { stakedPercentage: stakedPercentage || '0' })}</PlrStakingText>
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

const PlrStakingTitle = styled(Text)`
  ${fontStyles.big};
  font-family: ${appFont.medium};
`;

const PlrStakingText = styled(Text)`
  ${fontStyles.regular};
  margin-top: ${spacing.small}px;
`;

const BackgroundImage = styled(Image)`
  width: 200px;
  height: 600px;
  position: absolute;
  top: -135px;
  right: -50px;
`;

const TitleRow = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;
