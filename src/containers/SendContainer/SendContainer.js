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
import { Spacing } from 'components/Layout';
import ArrowIcon from 'components/ArrowIcon';
import Button from 'components/Button';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import ContactSelector from 'components/ContactSelector';
import Spinner from 'components/Spinner';
import ValueInput from 'components/ValueInput';

// types
import type { Props as ContactSelectorProps } from 'components/ContactSelector';
import type { ExternalProps as ValueSelectorProps } from 'components/ValueInput';
import type { Props as ButtonProps } from 'components/Button';

// utils
import { spacing } from 'utils/variables';

type ButtonWithoutTitle = $Diff<ButtonProps, { title: string }>


type FooterProps = {
  isNextButtonVisible?: boolean,
  buttonProps?: ButtonWithoutTitle,
  footerTopAddon?: React.Node,
  isLoading?: boolean,
};

type Props = {
  customSelectorProps?: ContactSelectorProps,
  customValueSelectorProps?: ValueSelectorProps,
  footerProps?: FooterProps,
  children?: React.Node,
  isLoading?: boolean,
  customScreenTitle?: string,
};

const FooterInner = styled.View`
  align-items: center;
  width: 100%;
  padding: ${spacing.large}px;
`;

const InputWrapper = styled.View`
  padding: 24px 40px 10px;
  align-items: center;
  z-index: 10;
`;

const Wrapper = styled.View`
  align-items: center;
`;

const SendFooter = (props: FooterProps) => {
  const {
    isNextButtonVisible, buttonProps = {}, footerTopAddon, isLoading,
  } = props;
  if (!footerTopAddon && !isNextButtonVisible) return null;
  if (isLoading) {
    return (
      <FooterInner>
        <Spinner style={{ alignSelf: 'center' }} />
      </FooterInner>
    );
  }
  return (
    <FooterInner>
      {footerTopAddon}
      {isNextButtonVisible &&
        // $FlowFixMe: flow update to 0.122
        <Button
          title={t('button.next')}
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
    customScreenTitle,
  } = props;

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: customScreenTitle || t('transactions.title.sendScreen') }] }}
      footer={<SendFooter {...footerProps} />}
      minAvoidHeight={800}
    >
      <Wrapper>
        <InputWrapper>{isLoading ? <Spinner /> : <ValueInput {...customValueSelectorProps} />}</InputWrapper>
        <ArrowIcon />
        <Spacing h={20} />
        <ContactSelector
          placeholder={t('label.whereToSend')}
          searchPlaceholder={t('label.walletAddressEnsUser')}
          noOptionImageFallback
          hasQRScanner
          disableSelfSelect
          allowEnteringCustomAddress
          {...customSelectorProps}
        />
      </Wrapper>
      {children}
    </ContainerWithHeader>
  );
};

export default SendContainer;
