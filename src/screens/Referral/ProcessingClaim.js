// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes } from 'utils/variables';
import { BoldText, LightText } from 'components/Typography';
import Spinner from 'components/Spinner';

const Status = styled(BoldText)`
  font-size: ${fontSizes.giant}px;
  text-align: center;
  margin-top: 35px;
  margin-bottom: 25px;
`;

const Text = styled(LightText)`
  font-size: ${fontSizes.medium}px;
  color: ${baseColors.coolGrey};
  text-align: center;
`;

const Center = styled.View`
  align-items: center; 
  flexDirection: column;
  justify-content: center;
  margin-horizontal: 20px;
`;

const ProcessingClaim = () => {
  return (
    <Center>
      <Spinner />
      <Status>
        Claiming...
      </Status>
      <Text>Transaction is processing.</Text>
      <Text>It may take a few minutes.</Text>
      <Text>You can check the status later</Text>
      <Text>here or in Home tab</Text>
    </Center>
  );
};

export default ProcessingClaim;
