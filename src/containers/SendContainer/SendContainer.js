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
import ValueSelectorCard from 'components/ValueSelectorCard';
import Button from 'components/Button';
import ArrowIcon from 'components/ArrowIcon';
import { Spacing } from 'components/Layout';

// types
import type { Props as SelectorProps } from 'components/Selector';
import type { ExternalProps as ValueSelectorProps } from 'components/ValueSelectorCard';
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
};

const FooterInner = styled.View`
  align-items: center;
  width: 100%;
  padding: ${spacing.large}px;
`;

const Wrapper = styled.View`
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
  } = props;

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: t('transactions.title.sendScreen') }] }}
      footer={<SendFooter {...footerProps} />}
      minAvoidHeight={800}
    >
      <Wrapper>
        <ValueSelectorCard
          selectorModalTitle={t('transactions.title.valueSelectorModal')}
          maxLabel={t('button.sendMax')}
          wrapperStyle={{ paddingTop: spacing.medium }}
          {...customValueSelectorProps}
        />
        <ArrowIcon />
        <Spacing h={20} />
        <Selector
          placeholder={t('label.whereToSend')}
          searchPlaceholder={t('label.walletAddress')}
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
