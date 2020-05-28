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
import { TouchableOpacity } from 'react-native';
import {
  BUILD_NUMBER,
  BCX_URL,
  SDK_PROVIDER,
  TX_DETAILS_URL,
  NETWORK_PROVIDER,
  NOTIFICATIONS_URL,
  COLLECTIBLES_NETWORK,
  OPEN_SEA_API,
} from 'react-native-dotenv';
import styled from 'styled-components/native';
import DeviceInfo from 'react-native-device-info';
import * as Sentry from '@sentry/react-native';

// components
import { ScrollWrapper } from 'components/Layout';
import { MediumText } from 'components/Typography';

// utils
import { fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { reportLog } from 'utils/common';


const LabeledRow = styled.View`
  margin: 6px 0;
`;

const Label = styled(MediumText)`
  ${fontStyles.regular};
  color: ${themedColors.secondaryText};
  letter-spacing: 0.5;
`;

const Value = styled(MediumText)`
  ${fontStyles.big};
`;


const SystemInfoModal = () => {
  const appVersion = DeviceInfo.getVersion();
  const appBundleId = DeviceInfo.getBundleId();
  const buildNumber = DeviceInfo.getBuildNumber();
  return (
    <ScrollWrapper regularPadding>
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
        <Label>COLLECTIBLES_NETWORK</Label>
        <Value>{COLLECTIBLES_NETWORK}</Value>
      </LabeledRow>
      <LabeledRow>
        <Label>NOTIFICATIONS_URL</Label>
        <Value>{NOTIFICATIONS_URL}</Value>
      </LabeledRow>
      <LabeledRow>
        <Label>OPEN_SEA_API</Label>
        <Value>{OPEN_SEA_API}</Value>
      </LabeledRow>
      <LabeledRow>
        <Label>NATIVE</Label>
        <TouchableOpacity
          onPress={() => {
            reportLog('Sentry report check #1!', { err1: true });
            reportLog('Sentry report check #2!', { err2: true }, Sentry.Severity.Error);
            throw new Error('Sentry report check #3!');
          }}
        >
          <Value>{appBundleId}-{appVersion} ({buildNumber})</Value>
        </TouchableOpacity>
      </LabeledRow>
    </ScrollWrapper>
  );
};

export default SystemInfoModal;
