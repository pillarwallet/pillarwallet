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
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';

// Components
import Text from 'components/core/Text';

// Types
import type { HistoricalTokenPrice } from 'models/Asset';

export const { width: SIZE } = Dimensions.get('window');

interface Props {
  items: HistoricalTokenPrice[];
  isActive: boolean;
  onChangePointer: (item: any, status: boolean) => void;
}

const PointerLevel = ({ items, isActive, onChangePointer }: Props) => {
  useEffect(() => {
    onChangePointer && onChangePointer(items[0], isActive);
  }, [items, isActive]);

  return (
    <Text variant="tiny" style={styles.textStyle}>
      {items[0].date}
    </Text>
  );
};

const styles = StyleSheet.create({
  textStyle: {
    position: 'absolute',
    top: 200,
  },
});

export default PointerLevel;
