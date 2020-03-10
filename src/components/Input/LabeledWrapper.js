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

import { fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { MediumText } from 'components/Typography';


type Props = {
  label: string,
  children: React.Node,
  onPress?: () => void,
};


const ItemLabel = styled(MediumText)`
  margin: 4px 0;
  ${fontStyles.regular};
  color: ${themedColors.accent};
  flex-wrap: wrap;
  width: 100%;
`;

const ItemSelectHolder = styled.TouchableOpacity`
  flex: 1;
`;


const LabeledWrapper = ({
  onPress,
  children,
  label,
}: Props) => (
  <ItemSelectHolder disabled={!onPress} onPress={onPress}>
    <ItemLabel>
      {label}
    </ItemLabel>

    {children}
  </ItemSelectHolder>
);

export default LabeledWrapper;
