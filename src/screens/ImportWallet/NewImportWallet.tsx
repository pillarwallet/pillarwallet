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
import { useDispatch } from 'react-redux';
import { Keyboard, StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';
import Clipboard from '@react-native-community/clipboard';

// actions
import { resetWalletImportErrorAction, importWalletFromMnemonicAction } from 'actions/onboardingActions';

// components
import { ScrollWrapper, Wrapper } from 'components/legacy/Layout';
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import {  MediumText } from 'components/legacy/Typography';
import TextInput from 'components/legacy/TextInput';
import Button from 'components/legacy/Button';

// utils
import { spacing } from 'utils/variables';
import { useThemeColors } from 'utils/themes';

// Selectors
import { useRootSelector } from 'selectors';

type Props = {
  importWalletFromMnemonic: (mnemonic: string) => void;
  wallet: Object;
  errorMessage: string;
  navigation: NavigationScreenProp<any>;
  resetWalletError: () => void;
  isImportingWallet: boolean;
};

const NewImportWallet: React.FC<Props> = () => {
  const dispatch = useDispatch();
  const colors = useThemeColors();
  const { errorMessage, isImportingWallet } = useRootSelector((state) => state.onboarding);
  const [wordsPhrase, setWordsPhrase] = React.useState('');

  const handleImportSubmit = () => {
    Keyboard.dismiss();
    const trimmedPhrase = wordsPhrase.split(' ').filter(Boolean).join(' ');
    dispatch(importWalletFromMnemonicAction(trimmedPhrase));
  };

  const handlePaste = async () => {
    const value = await Clipboard.getString();
    setWordsPhrase(value);
  };

  const handleValueChange = (value) => {
    setWordsPhrase(value);
    dispatch(resetWalletImportErrorAction());
  };

  const renderForm = () => {
    const inputProps = {
      onChange: handleValueChange,
      value: wordsPhrase,
      autoCapitalize: 'none',
      importantForAutofill: 'no',
      autoComplete: 'off',
    };

    return (
      <TextInput
        inputProps={{
          ...inputProps,
          multiline: true,
          numberOfLines: 2,
        }}
        additionalStyle={styles.additionalStyle}
        itemHolderStyle={styles.itemHolderStyle}
        errorMessage={errorMessage}
        testID={`${TAG}-input-phrase_word`}
        // eslint-disable-next-line i18next/no-literal-string
        accessibilityLabel={`${TAG}-input-phrase_word`}
      />
    );
  };

  const trimmedPhrase = wordsPhrase.split(' ').filter(Boolean);
  const disabled = !(trimmedPhrase?.length === 12 || trimmedPhrase?.length === 0) || isImportingWallet;

  const renderFooterButton = () => {
    if (trimmedPhrase?.length === 0) {
      return (
        <Button
          disabled={disabled}
          title={t('auth:button.paste')}
          onPress={handlePaste}
          isLoading={isImportingWallet}
          testID={`${TAG}-button-paste`}
          transparent
          textStyle={{ color: colors.graphPrimaryColor }}
        />
      );
    }
    return (
      <Button
        disabled={disabled}
        title={t('auth:button.import')}
        onPress={handleImportSubmit}
        isLoading={isImportingWallet}
        testID={`${TAG}-button-import_wallet`}
      />
    );
  };

  return (
    <ContainerWithHeader
      headerProps={{
        noBack: false,
      }}
      footer={<FooterWrapper>{renderFooterButton()}</FooterWrapper>}
    >
      <ScrollWrapper contentContainerStyle={{ flex: 1 }} disableAutomaticScroll keyboardShouldPersistTaps="always">
        <Wrapper regularPadding>
          <MediumText fontSize={24} center style={{ marginVertical: spacing.large }}>
            {t('auth:label.enterSeedPhrase')}
          </MediumText>

          <InputWrapper>
            <FormWrapper>{renderForm()}</FormWrapper>
          </InputWrapper>
        </Wrapper>
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

export default NewImportWallet;

const styles = StyleSheet.create({
  itemHolderStyle: { backgroundColor: 'transparent', width: 250, alignSelf: 'center', borderWidth: 0 },
  additionalStyle: { textAlign: 'center' },
});

const InputWrapper = styled.View`
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
  margin-top: 20px;
`;

const FooterWrapper = styled.View`
  justify-content: center;
  align-items: center;
  padding: ${spacing.large}px;
  width: 100%;
`;

const FormWrapper = styled.View`
  flex-direction: column;
  width: 100%;
`;

const TAG = 'NewImportWallet';
