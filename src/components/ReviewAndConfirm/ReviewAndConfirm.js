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
import { Platform } from 'react-native';
import t from 'translations/translate';

// components
import { ScrollWrapper } from 'components/legacy/Layout';
import { Label, MediumText, Paragraph } from 'components/legacy/Typography';
import Button from 'components/legacy/Button';
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
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
  if (isLoading) return <Spinner size={20} trackWidth={2} />;
  // $FlowFixMe: flow update to 0.122
  if (!isEmpty(valueArray)) return valueArray.map(val => <Value key={val}>{val}</Value>);
  if (value) return <Value>{value}</Value>;
  return null;
};

const ReviewAndConfirm = (props: Props) => {
  const {
    reviewData = [],
    isConfirmDisabled,
    onConfirm,
    submitButtonTitle,
    contentContainerStyle,
    customOnBack,
    errorMessage,
  } = props;

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: t('transactions.title.reviewAndConfirmScreen') }],
        customOnBack,
      }}
      footer={(
        <FooterWrapper>
          {!!errorMessage && <WarningMessage small>{errorMessage}</WarningMessage>}
          <Button
            disabled={isConfirmDisabled}
            onPress={onConfirm}
            title={submitButtonTitle || t('transactions.button.confirmTransaction')}
          />
        </FooterWrapper>
      )}
      shouldFooterAvoidKeyboard={Platform.OS === 'ios'}
    >
      <ScrollWrapper
        regularPadding
        disableAutomaticScroll
        contentContainerStyle={contentContainerStyle}
        disableOnAndroid
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
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

export default ReviewAndConfirm;
