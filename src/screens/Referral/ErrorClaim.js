// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes, fontStyles } from 'utils/variables';
import { LightText, MediumText } from 'components/Typography';
import Animation from 'components/Animation';

const animationFailure = require('assets/animations/transactionFailureAnimation.json');

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

const errorMessage = "We can't verify your code at this time.";

const ErrorClaim = () => {
  return (
    <Center>
      <Animation source={animationFailure} />
      <Status>
        Error
      </Status>
      <Text>{errorMessage}</Text>
      <Text>Please try later</Text>
    </Center>
  );
};

export default ErrorClaim;
