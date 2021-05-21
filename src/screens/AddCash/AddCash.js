import React from 'react';
import { View, Text, ScrollView, Keyboard } from 'react-native';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import t from 'translations/translate';
import { useThemeColors } from 'utils/themes';
import styled from 'styled-components/native';
import { fontSizes, spacing, appFont } from 'utils/variables';
import Button from 'components/Button';
import TextInput from 'components/TextInput';
import { BaseText } from 'components/Typography/Typography';
import {isValidCash} from  'utils/validators';
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
  const colors = useThemeColors();
  const [cash, setCash] = React.useState('');
  const fiatCurrency = useFiatCurrency();
  const currencySymbol = getCurrencySymbol(fiatCurrency);
  const onSubmitCallback: (values: SendwyreTrxValues) => void =
      navigation.getParam('onSubmit', () => {});

  return (
    <ContainerWithHeader
      inset={{ bottom: 'never' }}
      headerProps={{
        centerItems: [{ title: t('servicesContent.ramp.addCash.title') }],
        leftItems: [{ close: true, dismiss: true }],
      }}
      footer={
        <FooterWrapper>
          <Button onPress={() => onSubmitCallback({fiatCurrency, fiatValue: cash })} title={t('button.next')} disabled={!isValidCash(cash)} />
        </FooterWrapper>
      }
    >
      <View style={{ alignItems: 'center', width: '100%', flex: 1, justifyContent: 'center'}}>
      <BaseText medium>{t('servicesContent.ramp.addCash.subTitle')}</BaseText>
            <TextInput
              inputProps={{
                value: `${currencySymbol}${cash}` || '',
                autoCapitalize: 'none',
                disabled: false,
                onChangeText: (value) => {
                    console.log('value: ', value);
                    const cash =  value.substring(1);
                    console.log('cash: ', cash);
                    setCash(cash)
                },
                placeholder: '$0',
                keyboardType: 'numeric',
              }}
              inputWrapperStyle={{ marginTop: spacing.mediumLarge, backgroundColor: 'transparent', zIndex: 10, width: '80%' }}
              errorMessage={false}
              itemHolderStyle={{ borderWidth: 0, backgroundColor: 'transparent'}}
              placeholderTextColor='black'
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
