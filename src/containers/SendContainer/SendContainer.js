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
import t from 'translations/translate';

// components
import Selector from 'components/Selector';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import ValueInput from 'components/ValueInput';
import Button from 'components/Button';
import Spinner from 'components/Spinner';

// types
import type { Props as SelectorProps } from 'components/Selector';
import type { ExternalProps as ValueSelectorProps } from 'components/ValueInput';
import type { ExternalButtonProps as ButtonProps } from 'components/Button';

// utils
import { spacing } from 'utils/variables';

type ButtonWithoutTitle = $Diff<ButtonProps, { title: string }>


type FooterProps = {
  isNextButtonVisible?: boolean,
  buttonProps?: ButtonWithoutTitle,
  footerTopAddon?: React.Node,
};

type Props = {
  customSelectorProps?: SelectorProps,
  customValueSelectorProps?: ValueSelectorProps,
  footerProps?: FooterProps,
  children?: React.Node,
  isLoading?: boolean,
};

const FooterInner = styled.View`
  align-items: center;
  width: 100%;
  padding: ${spacing.large}px;
`;

const InputWrapper = styled.View`
  padding: 0 40px;
  align-items: center;
`;

const SendFooter = (props: FooterProps) => {
  const { isNextButtonVisible, buttonProps = {}, footerTopAddon } = props;
  if (!footerTopAddon && !isNextButtonVisible) return null;
  return (
    <FooterInner>
      {footerTopAddon}
      {isNextButtonVisible &&
        <Button
          title={t('button.next')}
          block
          marginTop={spacing.medium}
          {...buttonProps}
        />
      }
    </FooterInner>
  );
};

const SendContainer = (props: Props) => {
  const {
    customSelectorProps = {},
    customValueSelectorProps = {},
    footerProps = {},
    children,
    isLoading,
  } = props;

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: t('transactions.title.sendScreen') }] }}
      footer={<SendFooter {...footerProps} />}
      minAvoidHeight={800}
    >
      <Selector
        label={t('label.to')}
        placeholder={t('label.chooseReceiver')}
        searchPlaceholder={t('label.walletAddress')}
        wrapperStyle={{ marginTop: spacing.medium }}
        noOptionImageFallback
        hasQRScanner
        disableSelfSelect
        allowEnteringCustomAddress
        {...customSelectorProps}
      />
      <InputWrapper>
        {isLoading ? <Spinner /> : <ValueInput {...customValueSelectorProps} />}
      </InputWrapper>
      {children}
    </ContainerWithHeader>
  );
};

export default SendContainer;
