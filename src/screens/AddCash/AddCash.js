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
import { ScrollView, Keyboard, Platform } from 'react-native';
import t from 'translations/translate';
import styled from 'styled-components/native';
import { useNavigation } from 'react-navigation-hooks';

// utils
import { fontSizes, appFont } from 'utils/variables';
import { isValidFiatValue } from 'utils/validators';
import { getCurrencySymbol, hasTooMuchDecimals } from 'utils/common';
import { openInAppBrowser } from 'utils/inAppBrowser';
import { rampWidgetUrl } from 'utils/fiatToCrypto';
import { getActiveAccount, getAccountAddress, isSmartWalletAccount } from 'utils/accounts';
import { useThemeColors } from 'utils/themes';

// components
import { Container } from 'components/modern/Layout';
import Button from 'components/modern/Button';
import TextInput from 'components/TextInput';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/modern/Text';
import Toast from 'components/Toast';
import Modal from 'components/Modal';
import BuyCryptoAccountNotActiveModal from 'components/BuyCryptoAccountNotActiveModal';

// selectors
import { useFiatCurrency, accountsSelector, useRootSelector } from 'selectors';

import AddCashValueInputAccessoryHolder, {
  INPUT_ACCESSORY_NATIVE_ID,
} from './components/AddCashAccessory/AddCashValueInputAccessoryHolder';

const AddCash = () => {
  const navigation = useNavigation();
  const [value, setValue] = React.useState('0');
  const fiatCurrency = useFiatCurrency();
  const colors = useThemeColors();
  const currencySymbol = getCurrencySymbol(fiatCurrency);
  const accounts = useRootSelector(accountsSelector);

  const getCryptoPurchaseAddress = (): string | null => {
    const activeAccount = getActiveAccount(accounts);

    if (!activeAccount || !isSmartWalletAccount(activeAccount)) {
      Modal.open(() => <BuyCryptoAccountNotActiveModal />);
      return null;
    }

    return getAccountAddress(activeAccount);
  };

  const handleChangeText = (text: string) => {
    const amount = text.replace(currencySymbol, '');
    if (hasTooMuchDecimals(amount, 2)) return;
    const updatedAmount = amount.replace(/^0+/, '');
    setValue(updatedAmount);
  };

  const openUrl = async (url: string | null) => {
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

  const onSelectValue = async (accessoryValue: string) => {
    Keyboard.dismiss();
    setValue(accessoryValue);
  };

  const openRamp = () => {
    const address = getCryptoPurchaseAddress();
    if (address === null) return;
    openUrl(rampWidgetUrl(address, fiatCurrency, value));
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
          <Text color={colors.basic030} variant="medium">
            {t('servicesContent.ramp.addCash.subTitle')}
          </Text>
          <TextInput
            inputProps={{
              value: value ? `${currencySymbol}${value}` : undefined,
              autoCapitalize: 'none',
              disabled: false,
              onChangeText: handleChangeText,
              placeholder: `${currencySymbol}0`,
              keyboardType: 'numeric',
              onBlur: () => AddCashValueInputAccessoryHolder.removeAccessory(),
              onFocus: () => AddCashValueInputAccessoryHolder.addAccessory(onSelectValue),
              inputAccessoryViewID: INPUT_ACCESSORY_NATIVE_ID,
            }}
            inputWrapperStyle={styles.inputWrapperStyles}
            itemHolderStyle={styles.itemHolderStyles}
            additionalStyle={styles.additionalStyle}
            errorMessage={value && !isValidFiatValue(value) && t('error.invalid.fiatValue')}
          />
        </AddCashView>
      </ScrollView>
      <Footer behavior={Platform.OS === 'ios' ? 'position' : null}>
        <Button
          onPress={openRamp}
          title={t('button.next')}
          disabled={value !== null && (Number(value) === 0 || !isValidFiatValue(value))}
        />
      </Footer>
      <AddCashValueInputAccessoryHolder
        ref={(c) => {
          if (c && !AddCashValueInputAccessoryHolder.instances.includes(c)) {
            AddCashValueInputAccessoryHolder.instances.push(c);
          }
        }}
      />
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
    fontSize: fontSizes.jumbo,
    fontFamily: appFont.regular,
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

const Footer = styled.KeyboardAvoidingView`
  padding: 20px 20px 20px;
`;

export default AddCash;
