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
import { ScrollView, Keyboard } from 'react-native';
import t from 'translations/translate';
import styled from 'styled-components/native';
import { useNavigation } from 'react-navigation-hooks';


// utils
import { fontSizes, appFont } from 'utils/variables';
import { isValidFiatValue } from 'utils/validators';
import { getCurrencySymbol } from 'utils/common';
import { openInAppBrowser } from 'utils/inAppBrowser';
import { rampWidgetUrl } from 'utils/fiatToCrypto';

// compomnents
import { Container } from 'components/modern/Layout';
import { Footer } from 'components/Layout/Layout';
import Button from 'components/Button';
import TextInput from 'components/TextInput';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/modern/Text';
import Toast from 'components/Toast';

// selectors
import { useFiatCurrency } from 'selectors';


const AddCash = () => {
  const navigation = useNavigation();
  const [value, setValue] = React.useState('0');
  const fiatCurrency = useFiatCurrency();
  const currencySymbol = getCurrencySymbol(fiatCurrency);
  const address = navigation.getParam('address');
  const email = navigation.getParam('email');

  const tryOpenCryptoPurchaseUrl = async (url: string | null) => {
    if (url) {
      await openInAppBrowser(url).catch(showServiceLaunchError);
    } else {
      showServiceLaunchError();
    }
  };

  const showServiceLaunchError = () => {
    Toast.show({
      message: t('toast.cryptoPurchaseLaunchFailed'),
      emoji: 'hushed',
      supportLink: true,
    });
  };

  return (
    <Container>
      <HeaderBlock
        centerItems={[{ title: t('servicesContent.ramp.addCash.title') }]}
        leftItems={[{ close: true }]}
        navigation={navigation}
        noPaddingTop
      />
      <ScrollView onScroll={() => Keyboard.dismiss()} keyboardShouldPersistTaps="handled">
        <AddCashView>
          <Text variant="medium">{t('servicesContent.ramp.addCash.subTitle')}</Text>
          <TextInput
            inputProps={{
              value: `${currencySymbol}${value}`,
              autoCapitalize: 'none',
              disabled: false,
              onChangeText: (text) => {
                const amount = text.replace(currencySymbol, '');
                const updatedAmount = amount.replace(/^0+/, '');
                setValue(updatedAmount);
              },
              placeholder: '$0',
              keyboardType: 'numeric',
            }}
            inputWrapperStyle={styles.inputWrapperStyles}
            itemHolderStyle={styles.itemHolderStyles}
            additionalStyle={styles.additionalStyle}
            errorMessage={!isValidFiatValue(value) && t('error.invalid.fiatValue')}
          />
        </AddCashView>
      </ScrollView>
      <Footer>
        <Button
          onPress={() => tryOpenCryptoPurchaseUrl(rampWidgetUrl(address, email, fiatCurrency, value))}
          title={t('button.next')}
          disabled={value === '0' || !isValidFiatValue(value)}
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
    marginTop: 20,
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
  min-height: 220px;
  flex: 1;
  margin-top: 70px;
`;

export default AddCash;
