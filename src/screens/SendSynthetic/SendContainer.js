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
import { ScrollView, Keyboard } from 'react-native';
import styled from 'styled-components/native';
import t from 'translations/translate';
import { BigNumber } from 'bignumber.js';

// Components
import { Spacing } from 'components/legacy/Layout';
import ArrowIcon from 'components/ArrowIcon';
import Button from 'components/legacy/Button';
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import ContactSelector from 'components/ContactSelector';
import Spinner from 'components/Spinner';

// Utils
import { spacing } from 'utils/variables';

// Types
import type { ContactSelectorProps } from 'components/ContactSelector';
import type { Props as ButtonProps } from 'components/legacy/Button';
import type { AssetOption } from 'models/Asset';
import type { WalletAssetsBalances } from 'models/Balances';

// Local
import AssetSelector from './AssetSelector';

type Props = {
  assetData: ?AssetOption,
  onAssetDataChange: (token: AssetOption) => mixed,
  value: ?BigNumber,
  onValueChange: (value: ?BigNumber) => mixed,
  customAssets: AssetOption[],
  customBalances: WalletAssetsBalances,
  customSelectorProps?: ContactSelectorProps,
  footerProps?: FooterProps,
  children?: React.Node,
  isLoading?: boolean,
  customScreenTitle?: string,
};

const SendContainer = ({
  assetData,
  onAssetDataChange,
  value,
  onValueChange,
  customAssets,
  customBalances,
  customSelectorProps = {},
  footerProps = {},
  children,
  isLoading,
}: Props) => {
  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [
          {
            title: t('transactions.title.sendScreenPPN'),
          },
        ],
      }}
      footer={<SendFooter {...footerProps} />}
      minAvoidHeight={800}
      keyboardShouldPersistTaps="handled"
      onScroll={() => {
        !footerProps.isNextButtonVisible ? Keyboard.dismiss() : null;
      }}
    >
      <ScrollView onScroll={() => Keyboard.dismiss()} keyboardShouldPersistTaps="handled">
        <Wrapper>
          <SelectorWrapper>
            {!isLoading && (
              <AssetSelector
                tokens={customAssets}
                balances={customBalances}
                selectedToken={assetData}
                onSelectToken={onAssetDataChange}
                value={value}
                onValueChange={onValueChange}
              />
            )}

            {isLoading && <Spinner />}
          </SelectorWrapper>

          <Spacing h={20} />
          <ArrowIcon />
          <Spacing h={20} />

          <ContactSelector {...customSelectorProps} />
        </Wrapper>

        {children}
      </ScrollView>
    </ContainerWithHeader>
  );
};

export default SendContainer;

type ButtonWithoutTitle = $Diff<ButtonProps, { title: string }>;

type FooterProps = {
  isNextButtonVisible?: boolean,
  buttonProps?: ButtonWithoutTitle,
  footerTopAddon?: React.Node,
  isLoading?: boolean,
};

const SendFooter = (props: FooterProps) => {
  const { isNextButtonVisible, buttonProps = {}, footerTopAddon, isLoading } = props;
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
      {isNextButtonVisible && (
        // $FlowFixMe: flow update to 0.122
        <Button title={t('button.next')} marginTop={spacing.medium} {...buttonProps} />
      )}
    </FooterInner>
  );
};

const Wrapper = styled.View`
  align-items: center;
`;

const SelectorWrapper = styled.View`
  align-self: stretch;
  padding: 8px 20px 10px;
`;

const FooterInner = styled.View`
  align-items: center;
  width: 100%;
  padding: ${spacing.large}px;
`;
