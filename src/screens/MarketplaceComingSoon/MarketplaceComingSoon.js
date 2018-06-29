// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Container, Wrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import Title from 'components/Title';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';

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
      <Wrapper regularPadding>
        <Title title="marketplace" />
      </Wrapper>
      <ComingSoonBanner>
        <ComingSoonBannerText>Coming Soon</ComingSoonBannerText>
      </ComingSoonBanner>
      <Wrapper center regularPadding>
      </Wrapper>
    </Container>
  );
};

export default MarketplaceComingSoon;
