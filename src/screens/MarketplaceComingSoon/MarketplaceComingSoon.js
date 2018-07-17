// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Container, Wrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import Title from 'components/Title';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';

const MarketplaceHeader = styled.View`
  flex-direction: row;
  height: 97px;
  background-color: ${baseColors.white};
  padding: 0 16px;
  align-items: center;
  justify-content: space-between;
`;

const ComingSoonBanner = styled.View`
  padding: 16px;
  margin-bottom: 20px;
  background: ${baseColors.sunYellow};
`;

const ComingSoonBannerText = styled.Text`
  font-size: ${fontSizes.extraLarge};
  font-weight: ${fontWeights.bold};
`;

const MarketplaceComingSoon = () => {
  return (
    <Container>
      <MarketplaceHeader>
        <Title center noMargin title="marketplace" />
      </MarketplaceHeader>
      <ComingSoonBanner>
        <ComingSoonBannerText>Coming Soon</ComingSoonBannerText>
      </ComingSoonBanner>
      <Wrapper regularPadding>
        <Paragraph style={{ marginTop: 10 }}>
          The marketplace will contain many services.
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
      </Wrapper>
    </Container>
  );
};

export default MarketplaceComingSoon;
