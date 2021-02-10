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
import t from 'translations/translate';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText, MediumText } from 'components/Typography';
import Image from 'components/Image';
import Insight from 'components/Insight/Insight';
import InsightWithButton from 'components/InsightWithButton';
import { Spacing } from 'components/Layout';
import Stats from 'components/Stats';

import { fontStyles } from 'utils/variables';
import { getDeviceWidth, formatFiat, commify } from 'utils/common';
import { convertUSDToFiat } from 'utils/assets';

import { defaultFiatCurrency } from 'constants/assetsConstants';
import { RARI_POOLS } from 'constants/rariConstants';
import { RARI_ADD_DEPOSIT } from 'constants/navigationConstants';

import type { RootReducerState } from 'reducers/rootReducer';
import type { Rates } from 'models/Asset';
import type { RariPool } from 'models/RariPool';
import type { NavigationScreenProp } from 'react-navigation';


type Props = {
  rariFundBalance: {[RariPool]: number},
  baseFiatCurrency: ?string,
  rates: Rates,
  rtgPrice: {
    [string]: number,
  },
  rtgSupply: number,
  navigation: NavigationScreenProp<*>,
};

const bannerImage = require('assets/images/rari_pattern.png');
const rariLogo = require('assets/images/rari_logo.png');

const screenWidth = getDeviceWidth();
const bannerWidth = screenWidth - 40;

const HorizontalPadding = styled.View`
  padding: 0 ${({ p }) => p || 20}px;
`;

const Subtitle = styled(MediumText)`
  color: ${({ theme }) => theme.colors.basic010};
  ${fontStyles.big};
`;

const Paragraph = styled(BaseText)`
  color: ${({ theme }) => theme.colors.basic030};
  ${fontStyles.medium};
`;

const Banner = styled(Image)`
  width: ${bannerWidth}px;
  height: ${bannerWidth * (120 / 335)}px;
`;

// https://github.com/kfiroo/react-native-cached-image/issues/125
const RariLogoWrapper = styled.View`
  position: absolute;
  top: ${bannerWidth * (12 / 335)}px;
  right: ${bannerWidth * (12 / 335)}px;
`;

const RariLogo = styled(Image)`
  width: ${bannerWidth * (48 / 335)}px;
  height: ${bannerWidth * (48 / 335)}px;
`;

const RariInfoScreen = ({
  baseFiatCurrency,
  rates,
  rariFundBalance,
  rtgPrice,
  rtgSupply,
  navigation,
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
        <Spacing h={28} />
      </>
    );
  };

  const stats = [
    {
      title: t('rariContent.label.rgtPrice'),
      value: formatFiat(rtgPrice[fiatCurrency], fiatCurrency),
    },
    {
      title: t('rariContent.label.rgtSupply'),
      value: commify(rtgSupply, { skipCents: true }),
    },
    {
      title: t('rariContent.label.totalSupply'),
      value: formatFiat(totalRariFundBalanceInFiat, fiatCurrency, { skipCents: true }),
    },
  ];

  return (
    <ContainerWithHeader
      inset={{ bottom: 'never' }}
      headerProps={{
        centerItems: [{ title: t('rariContent.title.infoScreen') }],
      }}
      putContentInScrollView
    >
      <Spacing h={16} />
      <HorizontalPadding>
        <View>
          <Banner source={bannerImage} />
          <RariLogoWrapper>
            <RariLogo source={rariLogo} />
          </RariLogoWrapper>
        </View>
        <Spacing h={28} />
        <Subtitle>{t('label.keyFacts')}</Subtitle>
        <Spacing h={6} />
      </HorizontalPadding>
      <Stats stats={stats} />
      <Spacing h={16} />
      <HorizontalPadding p={4}>
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
      </HorizontalPadding>
      <Spacing h={44} />
      <HorizontalPadding>
        {renderParagraph(
          t('rariContent.infoContent.subtitle.whatIsRari'),
          t('rariContent.infoContent.paragraph.whatIsRari'),
        )}
        {renderParagraph(
          t('rariContent.infoContent.subtitle.howDoesRariEarn'),
          t('rariContent.infoContent.paragraph.howDoesRariEarn'),
        )}
        <Spacing h={4} />
        <InsightWithButton
          title={t('rariContent.infoContent.maximizeYieldInsight.title')}
          buttonTitle={t('rariContent.infoContent.maximizeYieldInsight.button')}
          buttonProps={{ small: false }}
          onButtonPress={() => navigation.navigate(RARI_ADD_DEPOSIT, { rariPool: RARI_POOLS.STABLE_POOL })}
        />
        <Spacing h={44} />
        <Subtitle>{t('rariContent.infoContent.subtitle.rariPools')}</Subtitle>
        <Spacing h={14} />
        <Paragraph>{t('rariContent.infoContent.paragraph.rariPools')}</Paragraph>
        <Spacing h={16} />
        <Insight
          isVisible
          insightChecklist={[
            { title: t('rariContent.infoContent.poolsInsight.stablePool') },
            { title: t('rariContent.infoContent.poolsInsight.yieldPool') },
            { title: t('rariContent.infoContent.poolsInsight.ethPool') },
          ]}
          borderRadius={30}
        />
        <Spacing h={28} />
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
        <Spacing h={4} />
        <InsightWithButton
          title={t('rariContent.infoContent.maximizeYieldInsight.title')}
          buttonTitle={t('rariContent.infoContent.maximizeYieldInsight.button')}
          buttonProps={{ small: false }}
          onButtonPress={() => navigation.navigate(RARI_ADD_DEPOSIT, { rariPool: RARI_POOLS.STABLE_POOL })}
        />
      </HorizontalPadding>
      <Spacing h={16} />
    </ContainerWithHeader>
  );
};

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
  rari: {
    rariFundBalance,
    rtgPrice,
    rtgSupply,
  },
  rates: { data: rates },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  rates,
  rariFundBalance,
  rtgPrice,
  rtgSupply,
});

export default connect(mapStateToProps)(RariInfoScreen);
