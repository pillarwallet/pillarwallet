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
import { connect } from 'react-redux';
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
import { getDeviceWidth, formatFiat } from 'utils/common';
import { convertUSDToFiat } from 'utils/assets';

import { defaultFiatCurrency } from 'constants/assetsConstants';

import type { RootReducerState } from 'reducers/rootReducer';
import type { Rates } from 'models/Asset';
import type { RariPool } from 'models/RariPool';


type Props = {
  rariFundBalance: {[RariPool]: number},
  baseFiatCurrency: ?string,
  rates: Rates,
};

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

const RariInfoScreen = ({
  baseFiatCurrency,
  rates,
  rariFundBalance,
}: Props) => {
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const totalRariFundBalance = (Object.values(rariFundBalance): any).reduce((sum, balance) => sum + balance, 0);
  const totalRariFundBalanceInFiat = convertUSDToFiat(totalRariFundBalance, rates, fiatCurrency);

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
            <MediumText big>
              {formatFiat(totalRariFundBalanceInFiat, fiatCurrency, { skipCents: true })}
            </MediumText>
            <BaseText secondary small>{t('rariContent.label.totalSupply')}</BaseText>
          </Card>
          <Spacing w={16} />
        </Row>
        <Insight
          isVisible
          insightNumberedList={[
            t('rariContent.infoContent.tableOfContents.whatIsRari'),
            t('rariContent.infoContent.tableOfContents.howDoesRariEarn'),
            t('rariContent.infoContent.tableOfContents.rariPools'),
            t('rariContent.infoContent.tableOfContents.howToDeposit'),
            t('rariContent.infoContent.tableOfContents.RGT'),
            t('rariContent.infoContent.tableOfContents.fees'),
          ]}
          borderRadius={30}
        />
        <Spacing h={5} />
        {renderParagraph(
          t('rariContent.infoContent.subtitle.whatIsRari'),
          t('rariContent.infoContent.paragraph.whatIsRari'),
        )}
        {renderParagraph(
          t('rariContent.infoContent.subtitle.howDoesRariEarn'),
          t('rariContent.infoContent.paragraph.howDoesRariEarn'),
        )}
        <InsightWithButton
          title={t('rariContent.infoContent.maximizeYieldInsight.title')}
          buttonTitle={t('rariContent.infoContent.maximizeYieldInsight.button')}
          buttonProps={{ small: false }}
        />
        <Spacing h={26} />
        {renderParagraph(
          t('rariContent.infoContent.subtitle.rariPools'),
          t('rariContent.infoContent.paragraph.rariPools'),
        )}
        <Insight
          isVisible
          insightChecklist={[
            { title: t('rariContent.infoContent.poolsInsight.stablePool') },
            { title: t('rariContent.infoContent.poolsInsight.yieldPool') },
            { title: t('rariContent.infoContent.poolsInsight.ethPool') },
          ]}
          borderRadius={30}
        />
        {renderParagraph(
          t('rariContent.infoContent.subtitle.deposits'),
          t('rariContent.infoContent.paragraph.deposits'),
          )}
        {renderParagraph(
          t('rariContent.infoContent.subtitle.withdrawals'),
          t('rariContent.infoContent.paragraph.withdrawals'),
          )}
        {renderParagraph(
          t('rariContent.infoContent.subtitle.RGT'),
          t('rariContent.infoContent.paragraph.RGT'),
          )}
        {renderParagraph(
          t('rariContent.infoContent.subtitle.performanceFee'),
          t('rariContent.infoContent.paragraph.performanceFee'),
          )}
        {renderParagraph(
          t('rariContent.infoContent.subtitle.withdrawalFee'),
          t('rariContent.infoContent.paragraph.withdrawalFee'),
          )}
        {renderParagraph(
          t('rariContent.infoContent.subtitle.RGTFee'),
          t('rariContent.infoContent.paragraph.RGTFee'),
          )}
        {renderParagraph(
          t('rariContent.infoContent.subtitle.rariFee'),
          t('rariContent.infoContent.paragraph.rariFee'),
          )}
        <InsightWithButton
          title={t('rariContent.infoContent.maximizeYieldInsight.title')}
          buttonTitle={t('rariContent.infoContent.maximizeYieldInsight.button')}
          buttonProps={{ small: false }}
        />
      </MainContainer>
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
  rari: {
    rariFundBalance,
  },
  rates: { data: rates },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  rates,
  rariFundBalance,
});

export default connect(mapStateToProps)(RariInfoScreen);
