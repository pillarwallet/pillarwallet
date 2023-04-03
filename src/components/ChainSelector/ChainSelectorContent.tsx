// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
import { FlatList, View, StyleSheet, TouchableOpacity } from 'react-native';

// Components
import Icon from 'components/core/Icon';

// Selector
import { useSupportedChains } from 'selectors/chains';

// Utils
import { useChainsConfig } from 'utils/uiConfig';
import { useThemeColors } from 'utils/themes';

// Types
import type { Chain } from 'models/Chain';

interface Props {
  supportedChain?: Chain[];
  selectedAssetChain: Chain;
  onSelectChain: (chain: Chain) => void;
}

const ChainSelectorContent = (props: Props) => {
  const { selectedAssetChain, onSelectChain, supportedChain } = props;
  let chains = useSupportedChains();
  const chainConfig = useChainsConfig();
  const colors = useThemeColors();

  if (supportedChain) {
    chains = supportedChain.filter((chain) => chains.includes(chain));
  }

  const onPressChain = (chain: Chain) => {
    // Basically second time select chain to disselect chain
    if (selectedAssetChain === chain) {
      onSelectChain(null);
    } else {
      onSelectChain(chain);
    }
  };

  const renderItem = (chain: Chain) => {
    const asset = chainConfig[chain];
    const isSelected = selectedAssetChain === chain;

    return (
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: isSelected ? colors.basic040 : colors.basic050 }]}
        onPress={() => onPressChain(chain)}
      >
        <Icon name={asset.iconName} width={40} height={40} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        bounces={false}
        data={chains}
        renderItem={({ item }) => renderItem(item)}
        style={{ marginHorizontal: 20, marginVertical: 10, maxHeight: 70, alignSelf: 'center' }}
        keyboardShouldPersistTaps="always"
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default ChainSelectorContent;

const styles = StyleSheet.create({
  container: {
    height: 90,
  },
  btn: {
    height: 55,
    width: 55,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
});
