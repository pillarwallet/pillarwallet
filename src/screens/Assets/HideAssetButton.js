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

import { BaseText } from 'components/Typography';
import Icon from 'components/Icon';
import { fontSizes } from 'utils/variables';
import { themedColors } from 'utils/themes';


type Props = {
  onPress: Function,
  expanded?: boolean,
  disabled?: boolean,
};

const HideButtonWrapper = styled.TouchableOpacity`
  padding: 10px;
  justify-content: center;
  align-items: center;
  flex: 1;
  background-color: ${themedColors.surface};
`;

const HideButtonLabel = styled(BaseText)`
  color: ${themedColors.negative};
  ${({ expanded, disabled }) => `
    font-size: ${expanded ? fontSizes.regular : fontSizes.small}px;
    opacity: ${disabled ? 0.5 : 1}
  `}
  margin-top: 8px;
`;

const TurnOffIcon = styled(Icon)`
  color: ${themedColors.negative};
  ${({ expanded, disabled }) => `
    font-size: ${expanded ? fontSizes.big : fontSizes.medium}px;
    opacity: ${disabled ? 0.5 : 1}
  `}
`;


const HideAssetButton = (props: Props) => {
  const { onPress, expanded, disabled } = props;
  return (
    <HideButtonWrapper onPress={onPress} activeOpacity={0.8}>
      <TurnOffIcon name="turn-off" disabled={disabled} />
      <HideButtonLabel expanded={expanded} disabled={disabled}>
        {t('button.hide')}
      </HideButtonLabel>
    </HideButtonWrapper>
  );
};

export default HideAssetButton;
