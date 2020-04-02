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
import ClosablePill from 'components/ClosablePill';
import type { PillItem } from 'components/ClosablePill';


type Props = {
  listItems: PillItem[],
  onItemClose: (id: string) => void,
  children?: React.Node,
};
const ListWrapper = styled.View`
  width: 100%;
  flex-wrap: wrap;
  flex-direction: row;
  margin: 4px 0;
`;
const ClosablePillList = (props: Props) => {
  const {
    listItems,
    onItemClose,
    children,
  } = props;

  return (
    <ListWrapper>
      {listItems.map(({ onClose, id, label }) => {
        return (
          <ClosablePill
            key={id}
            id={id}
            label={label}
            style={{ marginVertical: 4, marginRight: 8 }}
            onClose={() => onClose ? onClose(id) : onItemClose(id)}
          />);
      })}
      {children}
    </ListWrapper>
  );
};

export default ClosablePillList;
