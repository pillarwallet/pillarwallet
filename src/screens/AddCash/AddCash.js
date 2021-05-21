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
import { View } from 'react-native';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import t from 'translations/translate';
import styled from 'styled-components/native';
import { fontSizes, spacing, appFont } from 'utils/variables';
import Button from 'components/Button';
import TextInput from 'components/TextInput';
import { BaseText } from 'components/Typography/Typography';
import { isValidCash } from 'utils/validators';
import { useFiatCurrency } from 'selectors';
import { getCurrencySymbol } from 'utils/common';

const FooterWrapper = styled.View`
  justify-content: center;
  align-items: center;
  padding: ${spacing.large}px;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.basic070};
  margin-bottom: 30;
`;

const AddCash = ({ navigation }) => {
  const [cash, setCash] = React.useState('');
  const fiatCurrency = useFiatCurrency();
  const currencySymbol = getCurrencySymbol(fiatCurrency);
  const onSubmitCallback: (values: SendwyreTrxValues) => void = navigation.getParam('onSubmit', () => {});

  return (
    <ContainerWithHeader
      inset={{ bottom: 'never' }}
      headerProps={{
        centerItems: [{ title: t('servicesContent.ramp.addCash.title') }],
        leftItems: [{ close: true, dismiss: true }],
      }}
      footer={
        <FooterWrapper>
          <Button
            onPress={() => onSubmitCallback({ fiatCurrency, fiatValue: cash })}
            title={t('button.next')}
            disabled={!isValidCash(cash)}
          />
        </FooterWrapper>
      }
    >
      <View style={{ alignItems: 'center', width: '100%', flex: 1, justifyContent: 'center' }}>
        <BaseText medium>{t('servicesContent.ramp.addCash.subTitle')}</BaseText>
        <TextInput
          inputProps={{
            value: `${currencySymbol}${cash}` || '',
            autoCapitalize: 'none',
            disabled: false,
            onChangeText: (value) => {
              const cashValue = value.substring(1);
              setCash(cashValue);
            },
            placeholder: '$0',
            keyboardType: 'numeric',
          }}
          inputWrapperStyle={{
            marginTop: spacing.mediumLarge,
            backgroundColor: 'transparent',
            zIndex: 10,
            width: '80%',
          }}
          itemHolderStyle={{ borderWidth: 0, backgroundColor: 'transparent' }}
          placeholderTextColor={colos}
          additionalStyle={{
            fontSize: fontSizes.giant,
            fontFamily: appFont.medium,
            textAlign: 'center',
          }}
          errorMessage={!isValidCash(cash) && t('error.invalid.email')}
        />
      </View>
    </ContainerWithHeader>
  );
};

export default AddCash;
