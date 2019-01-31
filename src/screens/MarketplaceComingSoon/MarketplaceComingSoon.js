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
import styled from 'styled-components/native';
import { Container, ScrollWrapper } from 'components/Layout';
import { Paragraph, BoldText } from 'components/Typography';
import { baseColors, fontSizes, fontWeights, spacing } from 'utils/variables';
import Header from 'components/Header';

const ComingSoonBanner = styled.View`
  padding: ${spacing.rhythm}px;
  margin-bottom: 20px;
  background: ${baseColors.sunYellow};
`;

const ComingSoonBannerText = styled(BoldText)`
  font-size: ${fontSizes.extraLarge};
  font-weight: ${fontWeights.bold};
`;

const MarketplaceComingSoon = () => {
  return (
    <Container>
      <Header title="market" />
      <ComingSoonBanner>
        <ComingSoonBannerText>Coming Soon</ComingSoonBannerText>
      </ComingSoonBanner>
      <ScrollWrapper regularPadding showsVerticalScrollIndicator={false}>
        <Paragraph>
          The market will contain many services.
        </Paragraph>
        <Paragraph>
          20|30 will build the first service, an ICO platform, delivered through the Pillar wallet.
        </Paragraph>
        <Paragraph>
          As a participant in the UK Financial Control Authority sandbox,
          20|30 aims to conduct the UK’s first primary issuance of an equity token later this year.
        </Paragraph>
        <Paragraph>
          The London Stock Exchange Group (LSEG) and the Financial Conduct Authority are working with 20|30 and Nivaura
          to build a platform for corporate equity issuance.
        </Paragraph>
      </ScrollWrapper>
    </Container>
  );
};

export default MarketplaceComingSoon;
