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

import React, { useState } from 'react';
import { View } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import Tooltip from 'components/Tooltip';
import t from 'translations/translate';
import { hitSlop10 } from 'utils/common';
import { themedColors } from 'utils/themes';
import { BaseText } from 'components/Typography';

const Icon = styled.TouchableOpacity`
  height: 13px;
  width: 13px;
  border-color: ${themedColors.inactiveTabBarIcon};
  border-width: 1px;
  border-radius: 7;
  justify-content: center;
  align-items: center;
  margin-left: 5px;
  margin-right: 5px;
  text-align: center;
`;

const RenFeeIconText = styled(BaseText)`
  color: ${themedColors.inactiveTabBarIcon};
  font-size: 10px;
  text-align: center;
`;

const RenFeeIcon = () => {
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  return (
    <View style={{ alignItems: 'center' }}>
      <Tooltip body={t('wbtcCafe.renDescription')} isVisible={showTooltip} positionOnBottom={false}>
        <Icon
          onPress={() => setShowTooltip(!showTooltip)}
          activeOpacity={1}
          hitSlop={hitSlop10}
        >
          <RenFeeIconText>?</RenFeeIconText>
        </Icon>
      </Tooltip>
    </View>
  );
};

export default withTheme(RenFeeIcon);
