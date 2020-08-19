// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import t from 'translations/translate';

import { fontSizes, fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';
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
  color: ${themedColors.secondaryText};
  text-align: center;
`;

const Center = styled.View`
  align-items: center; 
  flexDirection: column;
  justify-content: center;
  margin-horizontal: 20px;
`;


const ErrorClaim = () => {
  return (
    <Center>
      <Animation source={animationFailure} />
      <Status>
        {t('referralsContent.title.claimTokensError')}
      </Status>
      <Text>{t('referralsContent.paragraph.rewardClaimingError')}</Text>
    </Center>
  );
};

export default ErrorClaim;
