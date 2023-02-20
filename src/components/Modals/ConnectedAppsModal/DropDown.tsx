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

import React, { FC, useEffect, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Modal,
  View,
  StyleProp,
  ViewStyle,
  DeviceEventEmitter,
  Dimensions,
} from 'react-native';

// Constants
import { WALLET_DROPDOWN_REF } from 'constants/walletConstants';

// Utils
import { useThemeColors } from 'utils/themes';

interface Props {
  dropDownStyle?: StyleProp<ViewStyle>;
  visible: boolean;
  onHide: (val: boolean) => void;
  modalContent: any;
  showOnlyBottomSide?: boolean;
}

const { height } = Dimensions.get('window');

const DropDown: FC<Props> = ({ dropDownStyle, visible, onHide, modalContent, showOnlyBottomSide }) => {
  const colors = useThemeColors();

  const [ref, setRef] = useState(null);
  const [dropDownFromTop, setDropDownFromTop] = React.useState(height);
  const [contentHeight, setContentHeight] = React.useState(0);

  useEffect(() => {
    DeviceEventEmitter.addListener(WALLET_DROPDOWN_REF, setRef);
    return () => {
      DeviceEventEmitter.removeAllListeners();
    };
  }, [visible]);

  useEffect(() => {
    if (!visible && !ref && contentHeight === 0) return;
    ref?.current?.measure((_fx, _fy, _w, h, _px, py) => {
      // eslint-disable-next-line no-mixed-operators
      if (!py || !h) return;
      if (height > py + contentHeight + h + 30 || showOnlyBottomSide) {
        setDropDownFromTop(py + h);
      } else {
        // eslint-disable-next-line no-mixed-operators
        setDropDownFromTop(py - contentHeight);
      }
    });
  }, [visible, ref, contentHeight]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={[styles.overlay]} onPress={() => onHide(false)} />
      <View
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          if (contentHeight !== height) setContentHeight(height);
        }}
        style={[styles.dropdown, { top: dropDownFromTop, backgroundColor: colors.basic080 }, dropDownStyle]}
      >
        {modalContent}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    position: 'absolute',
    alignSelf: 'center',
    padding: 10,
    width: 184,
    paddingHorizontal: 13,
    borderRadius: 16,
  },
  overlay: {
    width: '100%',
    height: '100%',
  },
});

export default DropDown;
