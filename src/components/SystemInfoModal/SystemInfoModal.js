// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
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
import { Wrapper } from 'components/Layout';
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


const SystemInfoModal = () => {
  return (
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
  );
};

export default SystemInfoModal;
