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
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import Text from 'components/modern/Text';

// Constants
import { CHAINS, ASSET_CATEGORIES } from 'constants/assetsConstants';
import { ASSETS, CONTACTS_FLOW, SERVICES_FLOW } from 'constants/navigationConstants';

// Selectors
import { useFiatCurrency } from 'selectors';

// Utils
import { formatFiatValue, formatFiatProfit } from 'utils/format';
import { useChainsConfig, useAssetCategoriesConfig } from 'utils/uiConfig';
import { useThemeColors } from 'utils/themes';

// Types
import type { ChainInfo, BalanceInfo } from 'models/Home';
import type { Chain, AssetCategory } from 'models/Asset';

// Local
import { useWalletInfo } from './utils';

type Props = {|
|};

function AssetsPieChart(props: Props) {
  const { t, tRoot } = useTranslationWithPrefix('home.assets');
  const navigation = useNavigation();

  const wallet = useWalletInfo();
  const fiatCurrency = useFiatCurrency();

  const chains = useChainsConfig();
  const categories = useAssetCategoriesConfig();
  const colors = useThemeColors();

  return (
    <Container>
      <Text>Pie Chart</Text>
    </Container>
  );
}

export default AssetsPieChart;

const Container = styled.View`
  align-items: center;
  background-color: red;
`;
