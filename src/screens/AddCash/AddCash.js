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
import { openUrl } from 'utils/inAppBrowser';
import { rampWidgetUrl, wertWidgetUrl } from 'utils/fiatToCrypto';
import {
  getActiveAccount,
  getAccountAddress,
  isSmartWalletAccount,
  isEtherspotAccount,
  getAccountType,
} from 'utils/accounts';
import { useThemeColors } from 'utils/themes';
import { isLogV2AppEvents } from 'utils/environment';
import { currentDate, currentTime } from 'utils/date';
import { getActiveScreenName } from 'utils/navigation';

// Components
import { Container } from 'components/layout/Layout';
import Button from 'components/legacy/Button';
import TextInput from 'components/legacy/TextInput';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/core/Text';
import Modal from 'components/Modal';
import BuyCryptoAccountNotActiveModal from 'components/BuyCryptoAccountNotActiveModal';
import Banner from 'components/Banner/Banner';

// Selectors
import { useFiatCurrency, accountsSelector, useRootSelector } from 'selectors';

// Actions
import { appsFlyerlogEventAction } from 'actions/analyticsActions';

import AddCashValueInputAccessoryHolder, {
  INPUT_ACCESSORY_NATIVE_ID,
} from './components/AddCashAccessory/AddCashValueInputAccessoryHolder';
import SelectResidentModal from './modal/SelectResidentModal';
import SelectNetworkModal from './modal/SelectNetworkModal';

let visibleModal = false;
const AddCash = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [value, setValue] = React.useState('0');
  const [inUS, setinUS] = React.useState(false);
  const [ref, setRef] = React.useState(null);

  // console.log('ref@@@@', ref?.focus());

  const fiatCurrency = useFiatCurrency();
  const colors = useThemeColors();
  const [currencySymbol, setCurrencySymbol] = React.useState(getCurrencySymbol(fiatCurrency));
  const buttonDisable = value !== null && (Number(value) === 0 || !isValidFiatValue(value));
  const accounts = useRootSelector(accountsSelector);
  const activeAccount = getActiveAccount(accounts);
  const screenName = getActiveScreenName(navigation);

  const residentSelected = (isUsResident: boolean) => {
    if (isUsResident) {
      setinUS(true);
      setCurrencySymbol('$');
    }
  };

  const networkSelected = () => {
    if (inUS) openWert();
    else openRamp();
  };

  const getCryptoPurchaseAddress = (): string | null => {
    if (!activeAccount || !isSmartWalletAccount(activeAccount)) {
      Modal.open(() => <BuyCryptoAccountNotActiveModal />);
      return null;
    }
    return getAccountAddress(activeAccount);
  };

  React.useEffect(() => {
    visibleModal = false;
    Modal.open(() => (
      <SelectResidentModal
        residentSelected={(isUsResident: boolean) => {
          visibleModal = true;
          residentSelected(isUsResident);
        }}
      />
    ));
  }, []);

  if (ref && visibleModal) {
    ref.focus();
  }

  const handleChangeText = (text: string) => {
    const amount = text.replace(currencySymbol, '');
    if (hasTooMuchDecimals(amount, 2)) return;
    const updatedAmount = amount.replace(/^0+/, '');
    setValue(updatedAmount);
  };

  const onSelectValue = async (accessoryValue: string) => {
    Keyboard.dismiss();
    setValue(accessoryValue);
  };

  const openSelectNetworkModal = () => {
    Modal.open(() => (
      <SelectNetworkModal
        networkSelected={() => {
          networkSelected();
        }}
      />
    ));
  };

  const openWert = () => {
    const cryptoAddress = getCryptoPurchaseAddress();
    if (cryptoAddress === null) return;
    activeAccount &&
      isLogV2AppEvents() &&
      dispatch(
        appsFlyerlogEventAction('add_cash_wert', {
          currency: currencySymbol,
          amount: value,
          date: currentDate(),
          time: currentTime(),
          address: cryptoAddress,
          platform: Platform.OS,
          walletType: getAccountType(activeAccount),
          link: wertWidgetUrl(cryptoAddress, value),
        }),
      );
    openUrl(wertWidgetUrl(cryptoAddress, value));
  };

  const openRamp = () => {
    const cryptoAddress = getCryptoPurchaseAddress();
    if (cryptoAddress === null) return;
    activeAccount &&
      isLogV2AppEvents() &&
      dispatch(
        appsFlyerlogEventAction('add_cash_ramp', {
          currency: currencySymbol,
          amount: value,
          date: currentDate,
          time: currentTime,
          address: cryptoAddress,
          platform: Platform.OS,
          walletType: getAccountType(activeAccount),
          link: rampWidgetUrl(cryptoAddress, fiatCurrency, value, isEtherspotAccount(activeAccount)),
        }),
      );
    openUrl(rampWidgetUrl(cryptoAddress, fiatCurrency, value, isEtherspotAccount(activeAccount)));
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
        <Banner screenName={screenName} bottomPosition={false} />
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
            getInputRef={setRef}
            inputWrapperStyle={styles.inputWrapperStyles}
            itemHolderStyle={styles.itemHolderStyles}
            additionalStyle={styles.additionalStyle}
            errorMessage={value && !isValidFiatValue(value) && t('error.invalid.fiatValue')}
            avoidAutoFocus
          />
        </AddCashView>
      </ScrollView>
      <Footer behavior={Platform.OS === 'ios' ? 'position' : null}>
        <Button onPress={openSelectNetworkModal} title={t('button.continue')} disabled={buttonDisable} />
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
