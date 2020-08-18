// @flow

import * as React from 'react';
import styled from 'styled-components/native';
import t from 'translations/translate';

import { fontSizes, fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';
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
  color: ${themedColors.secondaryText};
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
        {t('referralsContent.label.claiming')}
      </Status>
      <Text>{t('referralsContent.paragraph.rewardClaimingPending')}.</Text>
    </Center>
  );
};

export default ProcessingClaim;
