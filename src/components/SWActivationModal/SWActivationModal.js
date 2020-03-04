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
import { StyleSheet } from 'react-native';
import { withNavigation } from 'react-navigation';
import { connect } from 'react-redux';
import styled, { withTheme } from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { ListItemChevron } from 'components/ListItem/ListItemChevron';
import { LabelBadge } from 'components/LabelBadge';
import { Wrapper } from 'components/Layout';
import { getThemeColors, themedColors } from 'utils/themes';
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';
import { EXCHANGE } from 'constants/navigationConstants';
import { deploySmartWalletAction } from 'actions/smartWalletActions';
import type { Theme } from 'models/Theme';


type Props = {
  navigation: NavigationScreenProp<*>,
  theme: Theme,
  baseFiatCurrency: ?string,
  onModalClose: (() => void) => void,
  deploySmartWallet: () => void,
};

const ActionsWrapper = styled(Wrapper)`
  margin: 10px -20px 50px;
  border-bottom-width: ${StyleSheet.hairlineWidth}px;
  border-top-width: ${StyleSheet.hairlineWidth}px;
  border-color: ${themedColors.border};
`;

const SWActivationModal = ({
  navigation, theme, baseFiatCurrency, onModalClose, deploySmartWallet,
}: Props) => {
  const colors = getThemeColors(theme);

  return (
    <ActionsWrapper>
      <ListItemChevron
        label="I don't have tokens"
        subtext="Buy ETH with credit card"
        onPress={() => {
            onModalClose(() => {
              navigation.navigate(EXCHANGE, {
                fromAssetCode: baseFiatCurrency || defaultFiatCurrency,
                toAssetCode: ETH,
              });
            });
          }}
        color={colors.smartWalletText}
        bordered
        subtextAddon={<LabelBadge label="NEW" />}
      />
      <ListItemChevron
        label="I have tokens"
        subtext="Use ETH to deploy contract"
        onPress={() => {
            onModalClose(deploySmartWallet);
          }}
        color={colors.smartWalletText}
        bordered
      />
    </ActionsWrapper>
  );
};

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  baseFiatCurrency,
});

const mapDispatchToProps = (dispatch: Function) => ({
  deploySmartWallet: () => dispatch(deploySmartWalletAction()),
});

export default withNavigation(withTheme(connect(mapStateToProps, mapDispatchToProps)(SWActivationModal)));
