// @flow
import * as React from 'react';
import {
  BUILD_NUMBER,
  BCX_URL,
  SDK_PROVIDER,
  TX_DETAILS_URL,
  NETWORK_PROVIDER,
  NOTIFICATIONS_URL,
} from 'react-native-dotenv';
import styled from 'styled-components/native';
import { baseColors, fontSizes } from 'utils/variables';

const LabeledRow = styled.View`
  margin: 10px 0;
`;

const Label = styled.BaseText`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.extraSmall};
  letter-spacing: 0.5;
  font-weight: 600;
  line-height: 24px;
`;

const Value = styled.BaseText`
  font-weight: 700;
  font-size: ${fontSizes.medium}
`;

const SystemInfoModal = () => {
  return (
    <React.Fragment>
      <LabeledRow>
        <Label>BUILD_NUMBER</Label>
        <Value>{BUILD_NUMBER}</Value>
      </LabeledRow>
      <LabeledRow>
        <Label>BCX_URL</Label>
        <Value>{BCX_URL}</Value>
      </LabeledRow>
      <LabeledRow>
        <Label>SDK_PROVIDER</Label>
        <Value>{SDK_PROVIDER}</Value>
      </LabeledRow>
      <LabeledRow>
        <Label>TX_DETAILS_URL</Label>
        <Value>{TX_DETAILS_URL}</Value>
      </LabeledRow>
      <LabeledRow>
        <Label>NETWORK_PROVIDER</Label>
        <Value>{NETWORK_PROVIDER}</Value>
      </LabeledRow>
      <LabeledRow>
        <Label>NOTIFICATIONS_URL</Label>
        <Value>{NOTIFICATIONS_URL}</Value>
      </LabeledRow>
    </React.Fragment>
  );
};

export default SystemInfoModal;
