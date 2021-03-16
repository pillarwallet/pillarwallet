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
import { View, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Utils
import { spacing } from 'utils/variables';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';

type Props = {|
  children: React.Node,
  style?: ViewStyleProp,
|};

/**
 * This view is intended as default content for SlideModal. It should be used instead of regular `SafeAreaView`,
 * because that one occasionally experiences entry animation issue where whole modal shakes and becomes
 * unresponsive.
 *
 * See: https://github.com/facebook/react-native/issues/27049
 * See: https://github.com/react-native-modal/react-native-modal/issues/463
 *
 * TODO: Ultimately this should be part of `SlideModal`. However, there are many use-cases that apply their own buttom
 * padding and all of these would need to be refactored to avoid doubled padding.
 */
const SlideModalSafeAreaContent = ({ children, style }: Props) => {
  const { bottom } = useSafeAreaInsets();
  const isKeyboardVisible = useKeyboardVisible();

  const paddingBottom = isKeyboardVisible ? spacing.layoutSides : Math.max(bottom, spacing.layoutSides);


  return <View style={[styles.container, style, { paddingBottom }]}>{children}</View>;
};

const styles = {
  container: {
    alignItems: 'center',
  },
};

// Note: this hook is using `willShow`/`willHide` events (instead of `didShow`/`didHide`) to improve
// perceived behavior during animation.
const useKeyboardVisible = () => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const handleKeyboardWillShow = () => {
      setIsVisible(true);
    };
    const handleKeyboardWillHide = () => {
      setIsVisible(false);
    };

    Keyboard.addListener('keyboardWillShow', handleKeyboardWillShow);
    Keyboard.addListener('keyboardWillHide', handleKeyboardWillHide);
    return () => {
      Keyboard.removeListener('keyboardWillShow', handleKeyboardWillShow);
      Keyboard.removeListener('keyboardWillHide', handleKeyboardWillHide);
    };
  }, []);

  return isVisible;
};

export default SlideModalSafeAreaContent;
