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
import Header from 'components/Header';
import { Container, Wrapper } from 'components/Layout';
import { BoldText } from 'components/Typography';
import { baseColors, fontSizes } from 'utils/variables';

const LabeledRow = styled.View`
  margin: 10px 0;
`;

const Label = styled(BoldText)`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.extraSmall};
  letter-spacing: 0.5;
  line-height: 24px;
`;

const Value = styled(BoldText)`
  font-size: ${fontSizes.medium}
`;

type Props = {
  headerOnClose: Function,
}

const SystemInfoModal = (props: Props) => {
  return (
    <Container>
      <Header title="System Info" onClose={props.headerOnClose} />
      <Wrapper regularPadding>
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
      </Wrapper>
    </Container>
  );
};

export default SystemInfoModal;
