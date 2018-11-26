// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { fontSizes, baseColors, fontWeights } from 'utils/variables';
import { BoldText } from 'components/Typography';
import { NETWORK_PROVIDER } from 'react-native-dotenv';

const WarningBannerBackground = styled.View`
  background-color: ${baseColors.fireEngineRed};
  width: 100%;
  padding: ${props => props.small ? '8px' : '16px'};
  margin-bottom: 20px;
  justify-content: center;
  border-radius: ${props => props.rounded ? '8px' : 0};
`;

const WarningBannerText = styled(BoldText)`
  color: ${baseColors.white};
  font-size: ${props => props.small ? fontSizes.extraSmall : fontSizes.small};
  font-weight: ${fontWeights.bold};
`;

type Props = {
  rounded?: boolean,
  small?: boolean,
}

const WarningBanner = (props: Props) => {
  if (NETWORK_PROVIDER === 'ropsten') {
    return (
      <WarningBannerBackground small={props.small} rounded={props.rounded}>
        <WarningBannerText small={props.small}>
          Do not send real ETH or ERC20 tokens.
        </WarningBannerText>
      </WarningBannerBackground>
    );
  }
  return null;
};

export default WarningBanner;
