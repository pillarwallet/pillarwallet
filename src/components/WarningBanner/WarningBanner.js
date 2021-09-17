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
import styled from 'styled-components/native';
import t from 'translations/translate';

import { fontStyles } from 'utils/variables';
import { MediumText } from 'components/legacy/Typography';
import { getEnv } from 'configs/envConfig';
import { themedColors } from 'utils/themes';


type Props = {
  rounded?: boolean,
  small?: boolean,
};

const WarningBannerBackground = styled.View`
  background-color: ${themedColors.negative};
  width: 100%;
  padding: ${props => props.small ? '8px' : '16px'};
  justify-content: center;
  border-radius: ${props => props.rounded ? '8px' : 0};
`;

const WarningBannerText = styled(MediumText)`
  color: ${themedColors.control};
  ${props => props.small ? fontStyles.regular : fontStyles.medium};
`;

const WarningBanner = (props: Props) => {
  if (getEnv().NETWORK_PROVIDER === 'kovan') {
    return (
      <WarningBannerBackground small={props.small} rounded={props.rounded}>
        <WarningBannerText small={props.small}>{t('paragraph.doNotSendRealEthOrTokens')}</WarningBannerText>
      </WarningBannerBackground>
    );
  }
  return null;
};

export default WarningBanner;
