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
import { View } from 'react-native';
import styled from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import t from 'translations/translate';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText, MediumText } from 'components/Typography';
import Insight from 'components/Insight/Insight';
import InsightWithButton from 'components/InsightWithButton';
import { Spacing } from 'components/Layout';
import { themedColors } from 'utils/themes';
import { fontStyles } from 'utils/variables';
import { getDeviceWidth } from 'utils/common';


const bannerImage = require('assets/images/rari_pattern.png');
const rariLogo = require('assets/images/rari_logo.png');

const screenWidth = getDeviceWidth();
const bannerWidth = screenWidth - 40;

const MainContainer = styled.View`
  padding: 16px 20px;
`;

const Subtitle = styled(MediumText)`
  color: ${themedColors.text};
  ${fontStyles.big};
`;

const Paragraph = styled(BaseText)`
  color: ${themedColors.secondaryText};
  ${fontStyles.medium};
`;

const Row = styled.View`
  flex-direction: row;
`;

const Card = styled.View`
  background-color: ${themedColors.card};
  padding: 8px 16px 16px;
  border-radius: 6px;
`;

const Banner = styled(CachedImage)`
  width: ${bannerWidth}px;
  height: ${bannerWidth * (120 / 335)}px;
`;

// https://github.com/kfiroo/react-native-cached-image/issues/125
const RariLogoWrapper = styled.View`
  position: absolute;
  top: ${bannerWidth * (12 / 335)}px;
  right: ${bannerWidth * (12 / 335)}px;
`;

const RariLogo = styled(CachedImage)`
  width: ${bannerWidth * (48 / 335)}px;
  height: ${bannerWidth * (48 / 335)}px;
`;

const RariInfoScreen = () => {
  const renderParagraph = (subtitle, paragraph) => {
    return (
      <>
        <Subtitle>{subtitle}</Subtitle>
        <Spacing h={14} />
        <Paragraph>{paragraph}</Paragraph>
        <Spacing h={30} />
      </>
    );
  };
  return (
    <ContainerWithHeader
      inset={{ bottom: 'never' }}
      headerProps={{
        centerItems: [{ title: t('rariContent.title.infoScreen') }],
      }}
      putContentInScrollView
    >
      <MainContainer>
        <View>
          <Banner source={bannerImage} />
          <RariLogoWrapper>
            <RariLogo source={rariLogo} />
          </RariLogoWrapper>
        </View>
        <Spacing h={28} />
        <Subtitle>{t('rariContent.infoContent.subtitle.keyFacts')}</Subtitle>
        <Spacing h={6} />
        <Row>
          <Card>
            <MediumText big>$304,800</MediumText>
            <BaseText secondary small>{t('rariContent.label.totalSupply')}</BaseText>
          </Card>
          <Spacing w={16} />
          <Card>
            <MediumText big>12.36%</MediumText>
            <BaseText secondary small>{t('rariContent.label.currentAPY')}</BaseText>
          </Card>
        </Row>
        <Spacing h={36} />
        <Subtitle>{t('rariContent.infoContent.subtitle.generatingYield')}</Subtitle>
        <Spacing h={14} />
        <Paragraph>{t('rariContent.infoContent.paragraph.generatingYield')}</Paragraph>
        <Insight
          isVisible
          insightChecklist={[
            { title: t('rariContent.infoContent.insight.dYdX') },
            { title: t('rariContent.infoContent.insight.compound') },
            { title: t('rariContent.infoContent.insight.aave') },
            { title: t('rariContent.infoContent.insight.mStable') },
          ]}
          borderRadius={30}
        />
        <Spacing h={5} />
        <Paragraph>{t('rariContent.infoContent.paragraph.exchangingAssets')}</Paragraph>
        <InsightWithButton
          title={t('rariContent.infoContent.maximizeYieldInsight.title')}
          buttonTitle={t('rariContent.infoContent.maximizeYieldInsight.button')}
        />
        <Spacing h={26} />
        {renderParagraph(
          t('rariContent.infoContent.subtitle.RSPT'),
          t('rariContent.infoContent.paragraph.RSPT'),
        )}
        {renderParagraph(
          t('rariContent.infoContent.subtitle.performanceFee'),
          t('rariContent.infoContent.paragraph.performanceFee'),
          )}
        {renderParagraph(
          t('rariContent.infoContent.subtitle.COMP'),
          t('rariContent.infoContent.paragraph.COMP'),
          )}
        {renderParagraph(
          t('rariContent.infoContent.subtitle.deposits'),
          t('rariContent.infoContent.paragraph.deposits'),
          )}
        {renderParagraph(
          t('rariContent.infoContent.subtitle.withdrawals'),
          t('rariContent.infoContent.paragraph.withdrawals'),
          )}
      </MainContainer>
    </ContainerWithHeader>
  );
};

export default RariInfoScreen;
