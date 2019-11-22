// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes, fontStyles } from 'utils/variables';
import { LightText, MediumText } from 'components/Typography';
import Spinner from 'components/Spinner';

const Status = styled(MediumText)`
  font-size: ${fontSizes.giant}px;
  text-align: center;
  margin-top: 35px;
  margin-bottom: 25px;
`;

const Text = styled(LightText)`
  ${fontStyles.medium};
  color: ${baseColors.coolGrey};
  text-align: center;
`;

const Center = styled.View`
  align-items: center; 
  flexDirection: column;
  justify-content: center;
  margin-horizontal: 20px;
`;

const LogoutPending = () => {
  return (
    <Center>
      <Spinner />
      <Status>
        Claiming...
      </Status>
      <Text>here or in Home tab</Text>
    </Center>
  );
};

export default LogoutPending;
