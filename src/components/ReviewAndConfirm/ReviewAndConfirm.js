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
import styled from 'styled-components/native';
import isEmpty from 'lodash.isempty';

// components
import { ScrollWrapper } from 'components/Layout';
import { Label, MediumText, Paragraph } from 'components/Typography';
import Button from 'components/Button';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import TextInput from 'components/TextInput';
import Spinner from 'components/Spinner';

import { fontSizes, spacing } from 'utils/variables';
import { themedColors } from 'utils/themes';

type Data = {
  label: string,
  value?: string,
  valueArray?: string[],
  isLoading?: boolean,
};

type Props = {
  reviewData: Data[],
  isConfirmDisabled?: boolean,
  onConfirm: () => void | Promise<void>,
  onTextChange?: (text: string) => void,
  textInputValue?: ?string,
  submitButtonTitle?: string,
  contentContainerStyle?: Object,
  customOnBack?: () => void,
  errorMessage?: string,
};


const FooterWrapper = styled.View`
  justify-content: center;
  align-items: center;
  padding: ${spacing.large}px ${spacing.layoutSides}px;
  width: 100%;
`;

const LabeledRow = styled.View`
  margin: 10px 0;
`;

const Value = styled(MediumText)`
  font-size: ${fontSizes.big}px;
`;

const WarningMessage = styled(Paragraph)`
  text-align: center;
  color: ${themedColors.negative};
  padding-bottom: ${spacing.small}px;
`;

const ValueHolder = ({ value, valueArray, isLoading }) => {
  if (isLoading) return <Spinner width={20} height={20} />;
  if (!isEmpty(valueArray)) return valueArray.map(val => <Value key={val}>{val}</Value>);
  if (value) return <Value>{value}</Value>;
  return null;
};

const ReviewAndConfirm = (props: Props) => {
  const {
    reviewData = [],
    isConfirmDisabled,
    onConfirm,
    onTextChange,
    textInputValue,
    submitButtonTitle,
    contentContainerStyle,
    customOnBack,
    errorMessage,
  } = props;

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: 'Review and confirm' }],
        customOnBack,
      }}
      footer={(
        <FooterWrapper>
          {!!errorMessage && <WarningMessage small>{errorMessage}</WarningMessage>}
          <Button
            disabled={isConfirmDisabled}
            onPress={onConfirm}
            title={submitButtonTitle || 'Confirm Transaction'}
          />
        </FooterWrapper>
      )}
    >
      <ScrollWrapper
        regularPadding
        disableAutomaticScroll
        contentContainerStyle={contentContainerStyle}
      >
        {!!reviewData.length &&
        reviewData.map(({ label, ...rest }) => {
          return (
            <LabeledRow key={label}>
              <Label>{label}</Label>
              <ValueHolder {...rest} />
            </LabeledRow>
          );
        })
        }
        {!!onTextChange &&
        <TextInput
          inputProps={{
            onChange: (text) => onTextChange(text),
            value: textInputValue,
            autoCapitalize: 'none',
            multiline: true,
            numberOfLines: 3,
            placeholder: 'Add a note to this transaction',
          }}
          keyboardAvoidance
          inputWrapperStyle={{ marginTop: spacing.medium }}
        />
        }
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

export default ReviewAndConfirm;
