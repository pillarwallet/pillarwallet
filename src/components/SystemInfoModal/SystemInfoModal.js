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
/* eslint-disable i18next/no-literal-string */

import React from 'react';
import styled from 'styled-components/native';
import t from 'translations/translate';

import SlideModal from 'components/Modals/SlideModal';
import { Wrapper } from 'components/Layout';
import { MediumText } from 'components/Typography';
import { fontStyles } from 'utils/variables';
import { getEnv } from 'configs/envConfig';

const LabeledRow = styled.View`
  margin: 6px 0;
`;

const Label = styled(MediumText)`
  ${fontStyles.regular};
  color: ${({ theme }) => theme.colors.basic010};
  letter-spacing: 0.5;
`;

const Value = styled(MediumText)`
  ${fontStyles.big};
`;

const SystemInfoModal = () => {
  const {
    TX_DETAILS_URL_ETHEREUM,
    TX_DETAILS_URL_BINANCE,
    TX_DETAILS_URL_POLYGON,
    TX_DETAILS_URL_XDAI,
    NETWORK_PROVIDER,
    COLLECTIBLES_NETWORK,
    OPEN_SEA_API,
    BUILD_NUMBER,
  } = getEnv();
  return (
    <SlideModal
      fullScreen
      showHeader
      title={t('settingsContent.settingsItem.systemInfo.title')}
      insetTop
    >
      <Wrapper regularPadding>
        <LabeledRow>
          <Label>BUILD_NUMBER</Label>
          <Value>{BUILD_NUMBER}</Value>
        </LabeledRow>
        <LabeledRow>
          <Label>TX_DETAILS_URL_ETHEREUM</Label>
          <Value>{TX_DETAILS_URL_ETHEREUM}</Value>
        </LabeledRow>
        <LabeledRow>
          <Label>TX_DETAILS_URL_POLYGON</Label>
          <Value>{TX_DETAILS_URL_POLYGON}</Value>
        </LabeledRow>
        <LabeledRow>
          <Label>TX_DETAILS_URL_BINANCE</Label>
          <Value>{TX_DETAILS_URL_BINANCE}</Value>
        </LabeledRow>
        <LabeledRow>
          <Label>TX_DETAILS_URL_XDAI</Label>
          <Value>{TX_DETAILS_URL_XDAI}</Value>
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
          <Label>OPEN_SEA_API</Label>
          <Value>{OPEN_SEA_API}</Value>
        </LabeledRow>
      </Wrapper>
    </SlideModal>
  );
};

export default SystemInfoModal;
