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
import { FlatList } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import { Container } from 'components/modern/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Icon from 'components/modern/Icon';
import Text from 'components/modern/Text';

// Constants
import { supportedFiatCurrencies } from 'constants/assetsConstants';

// Selectors
import { useFiatCurrency } from 'selectors';

// Actions
import { saveBaseFiatCurrencyAction } from 'actions/appSettingsActions';

// Utils
import { fontStyles, spacing } from 'utils/variables';

// Types
import type { ImageSource } from 'utils/types/react-native';
import type { Currency } from 'models/Rates';

// Assets
const iconUSD = require('assets/icons/icon-48-fiat-usd.png');
const iconEUR = require('assets/icons/icon-48-fiat-eur.png');
const iconGBP = require('assets/icons/icon-48-fiat-gbp.png');

function SelectCurrency() {
  const { t } = useTranslationWithPrefix('menu.selectCurrency');
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const items = useCurrencyItems();
  const selectedValue = useFiatCurrency();

  const renderItem = (item: Item) => {
    const handePress = () => {
      navigation.goBack(null);
      dispatch(saveBaseFiatCurrencyAction(item.value));
    };

    return (
      <ItemContainer onPress={handePress}>
        <ItemImage source={item.iconSource} />
        <ItemTitle>{item.title}</ItemTitle>

        {item.value === selectedValue && <Icon name="checkmark" />}
      </ItemContainer>
    );
  };

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} />
      <FlatList
        data={items}
        renderItem={({ item }) => renderItem(item)}
        keyExtractor={(item) => item.value}
        contentContainerStyle={styles.contentContainerStyle}
        contentInsetAdjustmentBehavior="scrollableAxes"
      />
    </Container>
  );
}

const iconForCurrency = {
  USD: iconUSD,
  EUR: iconEUR,
  GBP: iconGBP,
};

type Item = {
  title: string,
  value: Currency,
  iconSource: ?ImageSource,
};

function useCurrencyItems(): Item[] {
  return supportedFiatCurrencies.map((currency) => ({
    title: currency,
    value: currency,
    iconSource: iconForCurrency[currency],
  }));
}

export default SelectCurrency;

const styles = {
  contentContainerStyle: {
    paddingTop: spacing.large,
  },
};

const ItemContainer = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 14px ${spacing.large}px;
`;

const ItemImage = styled.Image`
  height: 48px;
  width: 48px;
  margin-right: ${spacing.medium}px;
`;

const ItemTitle = styled(Text)`
  flex: 1;
  ${fontStyles.medium};
`;
