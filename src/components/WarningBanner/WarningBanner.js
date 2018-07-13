// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { fontSizes, baseColors, fontWeights } from 'utils/variables';

const WarningBannerBackground = styled.View`
  background-color: ${baseColors.fireEngineRed};
  width: 100%;
  padding: 16px;
  margin-bottom: 20px;
  justify-content: center;
  border-radius: ${props => props.rounded ? '8px' : 0};
`;

const WarningBannerText = styled.Text`
  color: ${baseColors.white};
  font-size: ${fontSizes.small};
  font-weight: ${fontWeights.bold};
`;

type Props = {
  rounded: boolean,
}

const WarningBanner = (props: Props) => {
  return (
    <WarningBannerBackground rounded={props.rounded}>
      <WarningBannerText>This wallet is deployed on Ropsten. Do not send real ETH or ERC20 tokens.</WarningBannerText>
    </WarningBannerBackground>
  );
};

export default WarningBanner;
