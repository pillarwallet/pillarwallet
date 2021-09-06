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
import styled from 'styled-components/native';

import Icon from 'components/legacy/Icon';
import { BaseText } from 'components/legacy/Typography';
import Spinner from 'components/Spinner';

import { fontSizes, spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';


type Props = {
  title: string,
  onPress: () => void,
  isLoading?: boolean,
};

const WalletTogleWrapper = styled.View`
  width: 100%;
  align-items: center;
`;

const Row = styled.View`
  padding: ${spacing.medium}px ${spacing.layoutSides}px;
  flex-direction: row;
  align-items: center;
`;

const ToggleText = styled(BaseText)`
  color: ${themedColors.secondaryText};
  font-size: ${fontSizes.regular}px;
  margin-left: 5px;
`;

const ToggleIcon = styled(Icon)`
  color: ${themedColors.secondaryText};
  font-size: ${fontSizes.medium}px;
  margin-left: 6px;
`;


const SimpleSwitcher = (props: Props) => {
  const { title, onPress, isLoading } = props;
  return (
    <WalletTogleWrapper>
      <TouchableOpacity onPress={onPress} disabled={isLoading}>
        <Row>
          {!isLoading ? <ToggleText>{title}</ToggleText> : <Spinner size={14} trackWidth={1} />}
          <ToggleIcon name="selector" />
        </Row>
      </TouchableOpacity>
    </WalletTogleWrapper>
  );
};

export default SimpleSwitcher;
