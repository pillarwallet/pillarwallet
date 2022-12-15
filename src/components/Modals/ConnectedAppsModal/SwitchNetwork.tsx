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

import React, { FC, ReactElement } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View, StyleProp, ViewStyle } from 'react-native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import Text from 'components/core/Text';
import { Spacing } from 'components/legacy/Layout';
import Icon from 'components/core/Icon';

// Utils
import { useThemeColors } from 'utils/themes';
import { useChainsConfig } from 'utils/uiConfig';

// Selectors
import { useSupportedChains } from 'selectors/chains';

// Modals
import type { Chain } from 'models/Chain';

// Local
import DropDown from './DropDown';

interface Props {
  dropDownStyle?: StyleProp<ViewStyle>;
  visible: boolean;
  onHide: (val: boolean) => void;
  onChangeChain: (chain: Chain) => void;
}

const SwitchNetwork: FC<Props> = ({ dropDownStyle, visible, onHide, onChangeChain }) => {
  const colors = useThemeColors();
  const chains = useChains();

  const { t } = useTranslationWithPrefix('walletConnect.connectedApps');

  const renderItem = ({ item }): ReactElement<any, any> => (
    <TouchableOpacity
      style={styles.btnContainer}
      onPress={() => {
        onChangeChain(item.chain);
        onHide(false);
      }}
    >
      <Icon name={item.icon} />
      <Spacing w={5} />
      <Text variant="regular" color={item.color}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <DropDown
      visible={visible}
      onHide={onHide}
      dropDownStyle={dropDownStyle}
      modalContent={
        <View style={{ maxHeight: 200 }}>
          <Text variant="regular" color={colors.basic030}>
            {t('switchNetwork')}
          </Text>
          <Spacing h={5} />
          <View style={[styles.line, { backgroundColor: colors.basic050 }]} />
          <FlatList data={chains} renderItem={renderItem} keyExtractor={(item) => item.value} />
        </View>
      }
    />
  );
};

const useChains = (): any[] => {
  const chains = useSupportedChains();
  const config = useChainsConfig();

  const chainTabs = chains.map((chain) => ({
    key: chain,
    chain,
    value: config[chain].title,
    label: config[chain].titleShort,
    icon: config[chain].iconName,
  }));
  return chainTabs;
};

const styles = StyleSheet.create({
  line: {
    width: '100%',
    height: 1,
  },
  btnContainer: { paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
});

export default SwitchNetwork;
