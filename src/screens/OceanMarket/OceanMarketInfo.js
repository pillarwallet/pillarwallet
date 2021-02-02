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
import { CachedImage } from 'react-native-cached-image';
import t from 'translations/translate';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText, MediumText } from 'components/Typography';
import InsightWithButton from 'components/InsightWithButton';
import { Spacing } from 'components/Layout';

import { getDeviceWidth } from 'utils/common';

import {OCEAN_MARKET} from 'constants/navigationConstants';


type Props = {
  navigation: NavigationScreenProp<*>,
};

const bannerImage = require('assets/images/service-banner.png');

const screenWidth = getDeviceWidth();
const bannerWidth = screenWidth - 40;

const MainContainer = styled.View`
  padding: 16px 20px;
`;

const BannerImage = styled(CachedImage)`
  width: ${bannerWidth}px;
  height: ${bannerWidth * (114 / 335)}px;
`;

const OceanMarketInfoScreen = ({
  navigation,
}: Props) => {
  return (
    <ContainerWithHeader
      inset={{ bottom: 'never' }}
      headerProps={{
        centerItems: [{ title: t('oceanMarketContent.title.infoScreen') }],
      }}
      putContentInScrollView
    >
      <MainContainer>
        <BannerImage source={bannerImage} />
        <Spacing h={24} />
        <BaseText medium secondary>{t('oceanMarketContent.infoContent.paragraph.main')}</BaseText>
        <Spacing h={28} />
        <MediumText big>{t('oceanMarketContent.infoContent.subtitle.datatokens')}</MediumText>
        <Spacing h={14} />
        <BaseText medium secondary>{t('oceanMarketContent.infoContent.paragraph.datatokens')}</BaseText>
        <Spacing h={32} />
        <InsightWithButton
          title={t('oceanMarketContent.infoContent.insight.title')}
          buttonTitle={t('oceanMarketContent.infoContent.insight.button')}
          onButtonPress={() => navigation.navigate(OCEAN_MARKET)}
        />
        <Spacing h={44} />
        <MediumText big>{t('oceanMarketContent.infoContent.subtitle.marketplaces')}</MediumText>
        <Spacing h={14} />
        <BaseText medium secondary>{t('oceanMarketContent.infoContent.paragraph.marketplaces')}</BaseText>
        <Spacing h={28} />
        <MediumText big>{t('oceanMarketContent.infoContent.subtitle.compute')}</MediumText>
        <Spacing h={14} />
        <BaseText medium secondary>{t('oceanMarketContent.infoContent.paragraph.compute')}</BaseText>
        <Spacing h={28} />
        <MediumText big>{t('oceanMarketContent.infoContent.subtitle.dataScience')}</MediumText>
        <Spacing h={14} />
        <BaseText medium secondary>{t('oceanMarketContent.infoContent.paragraph.dataScience')}</BaseText>
        <Spacing h={50} />
      </MainContainer>

    </ContainerWithHeader>
  );
};

export default OceanMarketInfoScreen;
