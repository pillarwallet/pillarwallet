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

import React from 'react';
import t from 'translations/translate';
import styled from 'styled-components/native';
import { useNavigation } from 'react-navigation-hooks';

// utils
import { fontSizes, appFont } from 'utils/variables';
import { isValidFiatValue } from 'utils/validators';
import { getCurrencySymbol } from 'utils/common';

// compomnents
import { Footer } from '../../components/Layout/Layout';
import { Container } from 'components/modern/Layout';
import Button from 'components/Button';
import TextInput from 'components/TextInput';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/modern/Text';

// selectors
import { useFiatCurrency } from 'selectors';

const AddCash = () => {
  const navigation = useNavigation();
  const [cash, setCash] = React.useState<BigNumber>(0);
  const fiatCurrency = useFiatCurrency();
  const currencySymbol = getCurrencySymbol(fiatCurrency);
  const onSubmitCallback: (values: SendwyreTrxValues) => void = navigation.getParam('onSubmit', () => {});

  return (
    <Container>
      <HeaderBlock
        centerItems={[{ title: t('servicesContent.ramp.addCash.title') }]}
        leftItems={[{ close: true, dismiss: true }]}
        navigation={navigation}
      />
      <AddCashView>
        <Text medium>{t('servicesContent.ramp.addCash.subTitle')}</Text>
        <TextInput
          inputProps={{
            value: `${currencySymbol}${cash}`,
            autoCapitalize: 'none',
            disabled: false,
            onChangeText: (text) => {
              const value = text.substring(1);
              setCash(value);
            },
            placeholder: '$0',
            keyboardType: 'numeric',
          }}
          inputWrapperStyle={styles.inputWrapperStyles}
          itemHolderStyle={styles.itemHolderStyles}
          additionalStyle={styles.additionalStyle}
          errorMessage={!isValidFiatValue(cash) && t('error.invalid.email')}
        />
      </AddCashView>
      <Footer>
        <Button
          onPress={() => onSubmitCallback({ fiatCurrency, fiatValue: cash })}
          title={t('button.next')}
          disabled={!isValidFiatValue(cash)}
        />
      </Footer>
    </Container>
  );
};

const styles = {
  inputWrapperStyles: {
    backgroundColor: 'transparent',
    zIndex: 10,
    width: '80%',
  },
  itemHolderStyles: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  additionalStyle: {
    fontSize: fontSizes.giant,
    fontFamily: appFont.medium,
    textAlign: 'center',
  },
};

const AddCashView = styled.View`
  align-items: center;
  width: 100%;
  flex: 1;
  margin-top: 70px;
`;

export default AddCash;
