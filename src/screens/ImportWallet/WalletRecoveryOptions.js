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
import { FlatList } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// constants
import { IMPORT_WALLET, RECOVERY_PORTAL_WALLET_RECOVERY_INTRO } from 'constants/navigationConstants';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ListItemChevron } from 'components/ListItem/ListItemChevron';
import { ScrollWrapper } from 'components/Layout';

// utils
import { getThemeColors, themedColors } from 'utils/themes';

// types
import type { Theme } from 'models/Theme';

// images
const imageRecovery = require('assets/images/recovery.png');

const RecoveryIcon = styled.Image`
  width: 73px;
  height: 73px;
  alignSelf: center;
  marginVertical: 50px;
  tintColor: ${themedColors.positive};
`;

type Props = {
  navigation: NavigationScreenProp,
  theme: Theme,
};

const WalletRecoveryOptions = (props: Props) => {
  const { theme, navigation } = props;

  const colors = getThemeColors(theme);

  const renderRecoveryOption = ({ item }) => {
    const { title, route } = item;
    return (
      <ListItemChevron
        label={title}
        chevronColor={colors.secondaryText}
        wrapperStyle={{ backgroundColor: colors.card }}
        onPress={() => navigation.navigate(route)}
        bordered
      />
    );
  };

  const recoveryOptions = [
    { title: t('auth:button.enterWordsSeed'), route: IMPORT_WALLET },
    { title: t('auth:button.useRecoveryPortal'), route: RECOVERY_PORTAL_WALLET_RECOVERY_INTRO },
  ];

  return (
    <ContainerWithHeader headerProps={{ centerItems: [{ title: t('auth:title.recoveryOptions') }] }}>
      <ScrollWrapper>
        <RecoveryIcon
          source={imageRecovery}
          resizeMode="contain"
        />
        <FlatList
          data={recoveryOptions}
          keyExtractor={({ route }) => route}
          renderItem={renderRecoveryOption}
        />
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

export default withTheme(WalletRecoveryOptions);
