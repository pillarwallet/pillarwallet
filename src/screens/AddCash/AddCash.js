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
import { useDispatch } from 'react-redux';

// Utils
import { fontSizes, appFont } from 'utils/variables';
import { isValidFiatValue } from 'utils/validators';
import { getCurrencySymbol, hasTooMuchDecimals } from 'utils/common';
import { openInAppBrowser } from 'utils/inAppBrowser';
import { rampWidgetUrl } from 'utils/fiatToCrypto';
import { getActiveAccount, getAccountAddress, isSmartWalletAccount, isEtherspotAccount } from 'utils/accounts';
import { useThemeColors } from 'utils/themes';
import { isLogV2AppEvents } from 'utils/environment';

// Components
import { Container } from 'components/modern/Layout';
import Button from 'components/core/Button';
import TextInput from 'components/legacy/TextInput';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/core/Text';
import Toast from 'components/Toast';
import Modal from 'components/Modal';
import BuyCryptoAccountNotActiveModal from 'components/BuyCryptoAccountNotActiveModal';

// Selectors
import { useFiatCurrency, accountsSelector, useRootSelector } from 'selectors';

// Actions
import { logEventAction } from 'actions/analyticsActions';

import AddCashValueInputAccessoryHolder, {
  INPUT_ACCESSORY_NATIVE_ID,
} from './components/AddCashAccessory/AddCashValueInputAccessoryHolder';

const AddCash = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [value, setValue] = React.useState('0');
  const fiatCurrency = useFiatCurrency();
  const colors = useThemeColors();
  const currencySymbol = getCurrencySymbol(fiatCurrency);
  const accounts = useRootSelector(accountsSelector);
  const activeAccount = getActiveAccount(accounts);

  const getCryptoPurchaseAddress = (): string | null => {
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
    isLogV2AppEvents() && dispatch(logEventAction('v2_add_cash_started'));
    openUrl(rampWidgetUrl(address, fiatCurrency, value, isEtherspotAccount(activeAccount)));
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
              value: `${currencySymbol}${value}`,
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
