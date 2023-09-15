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
/* eslint-disable i18next/no-literal-string */

import React, { useRef } from 'react';
import { Keyboard } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import styled, { useTheme } from 'styled-components/native';
import t from 'translations/translate';

// Components
import { BaseText } from 'components/legacy/Typography';
import Button from 'components/legacy/Button';
import ModalBox from 'components/ModalBox';
import TextInput from 'components/legacy/TextInput';
import Title from 'components/legacy/Title';

// Utils
import { isValidEmail } from 'utils/validators';
import { fontStyles, spacing } from 'utils/variables';

type Props = {
  onSave: (email: string) => void;
  onModalHide?: () => void;
};

type FormData = {
  email: string;
};

const SigninWithEmailModal = ({ onSave, onModalHide }: Props) => {
  const modalRef: any = useRef();

  const formSchema = yup.object().shape({
    email: yup.string().required(t('error.emptyAddress')).test('isValid', t('error.invalid.email'), isValidEmail),
  });

  const { control, handleSubmit, errors, watch, getValues, setValue } = useForm({
    defaultValues: { email: '' },
    resolver: yupResolver(formSchema),
    mode: 'onTouched',
  });

  const onSubmit = async ({ email }: FormData) => {
    modalRef.current?.close();
    onSave(email);
  };

  const modelHide = () => {
    Keyboard.dismiss();
    onModalHide && onModalHide();
  };

  const theme = useTheme();

  const errorMessage = errors.email?.message;

  return (
    <ModalBox ref={modalRef} onModalHide={modelHide} noBoxMinHeight>
      <Container>
        <TitleWrapper>
          <Title
            align="center"
            title={t('biometricLogin.title', { biometryType: 'Email' })}
            style={{ marginBottom: spacing.small }}
            noMargin
          />
        </TitleWrapper>

        <Controller
          name="email"
          control={control}
          render={({ value, onChange, onBlur }) => (
            <InputWrapper>
              <TextInput
                theme={theme}
                inputWrapperStyle={{ flex: 1, paddingBottom: 0 }}
                inputProps={{
                  value,
                  onChangeText: onChange,
                  onBlur,
                  placeholder: t('form.email.enterEmail'),
                  autoCapitalize: 'none',
                  autoFocus: true,
                }}
              />
            </InputWrapper>
          )}
        />

        {!!errorMessage && <StatusMessage danger>{errorMessage}</StatusMessage>}

        <Button
          title={t('button.signin')}
          disabled={!!errorMessage}
          onPress={handleSubmit(onSubmit)}
          marginTop={spacing.large}
        />
        <Button
          title={t('button.cancel')}
          onPress={() => {
            Keyboard.dismiss();
            modalRef.current?.close();
          }}
          transparent
        />
      </Container>
    </ModalBox>
  );
};

export default SigninWithEmailModal;

const InputWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: ${spacing.small}px;
`;

const Container = styled.View`
  padding: ${spacing.rhythm}px ${spacing.rhythm}px;
`;

const StatusMessage = styled(BaseText)`
  ${fontStyles.small};
  margin-top: ${spacing.large}px;
  text-align: center;
`;

const TitleWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-bottom: ${spacing.large}px;
`;
