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
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import Image from 'components/Image';
import { BaseText, MediumText } from 'components/legacy/Typography';
import InsightWithButton from 'components/InsightWithButton';
import { Spacing } from 'components/legacy/Layout';

import { getDeviceWidth } from 'utils/common';

import { LIQUIDITY_POOLS } from 'constants/navigationConstants';


type Props = {
  navigation: NavigationScreenProp<*>,
};

const bannerImage = require('assets/images/banners-liquidity-pools.png');

const screenWidth = getDeviceWidth();
const bannerWidth = screenWidth - 40;

const MainContainer = styled.View`
  padding: 16px 20px;
`;

const BannerImage = styled(Image)`
  width: ${bannerWidth}px;
  height: ${bannerWidth * (114 / 335)}px;
`;

const LiquidityPoolsInfoScreen = ({
  navigation,
}: Props) => {
  return (
    <ContainerWithHeader
      inset={{ bottom: 'never' }}
      headerProps={{
        centerItems: [{ title: t('liquidityPoolsContent.title.infoScreen') }],
      }}
      putContentInScrollView
    >
      <MainContainer>
        <BannerImage source={bannerImage} />
        <Spacing h={35} />
        <MediumText big>{t('liquidityPoolsContent.infoContent.subtitle.whatAreLiquidityPools')}</MediumText>
        <Spacing h={14} />
        <BaseText medium secondary>{t('liquidityPoolsContent.infoContent.paragraph.whatAreLiqudityPools')}</BaseText>
        <Spacing h={28} />
        <MediumText big>{t('liquidityPoolsContent.infoContent.subtitle.howDoLiquidityPoolsWork')}</MediumText>
        <Spacing h={22} />
        <BaseText medium secondary>{t('liquidityPoolsContent.infoContent.paragraph.howDoLiquidityPoolsWork')}</BaseText>
        <Spacing h={24} />
        <InsightWithButton
          title={t('liquidityPoolsContent.infoContent.insight.title')}
          buttonTitle={t('liquidityPoolsContent.infoContent.insight.button')}
          onButtonPress={() => { navigation.navigate(LIQUIDITY_POOLS); }}
        />
        <Spacing h={50} />
      </MainContainer>

    </ContainerWithHeader>
  );
};

export default LiquidityPoolsInfoScreen;
