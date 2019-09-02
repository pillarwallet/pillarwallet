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

import { baseColors, spacing } from 'utils/variables';
import { ListCard } from 'components/ListItem/ListCard';
import Icon from 'components/Icon';
import { responsiveSize } from 'utils/ui';

type Props = {|
  iconSource: string,
  title: string,
  subtitle: string,
  noteText: string,
  noteIcon: string,
  isActive: boolean,
  isInitialised: boolean,
  action: () => void,
  initialiseAction: () => void,
|};

const CheckIcon = styled(Icon)`
  font-size: ${responsiveSize(14)}px;
  color: ${baseColors.electricBlue};
  position: absolute;
  top: ${spacing.mediumLarge}px;
  right: ${spacing.mediumLarge}px;
`;

export const NetworkListCard = (props: Props) => {
  const {
    iconSource,
    title,
    subtitle,
    isActive,
    isInitialised,
    action,
    initialiseAction,
    noteText,
    noteIcon,
  } = props;

  return (
    <ListCard
      title={title}
      subtitle={subtitle}
      action={isInitialised ? action : initialiseAction}
      note={{ note: noteText, emoji: noteIcon }}
      iconSource={iconSource}
      contentWrapperStyle={{
        borderWidth: 2,
        borderColor: isActive ? baseColors.electricBlue : baseColors.white,
        borderRadius: 6,
      }}
    >
      {isActive && <CheckIcon name="check" />}
    </ListCard>
  );
};
