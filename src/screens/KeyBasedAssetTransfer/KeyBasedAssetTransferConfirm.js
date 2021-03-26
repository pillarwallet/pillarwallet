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
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import { formatEther } from 'ethers/lib/utils';
import isEmpty from 'lodash.isempty';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import { Footer, Wrapper } from 'components/Layout';
import { BaseText, MediumText } from 'components/Typography';
import Button from 'components/Button';
import * as Form from 'components/modern/Form';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import FeeLabelToggle from 'components/FeeLabelToggle';
import Spinner from 'components/Spinner';

import Text from 'components/modern/Text';

// Constants
import { ETH, COLLECTIBLES } from 'constants/assetsConstants';
import { KEY_BASED_ASSET_TRANSFER_UNLOCK } from 'constants/navigationConstants';

// Selectors
import { useRootSelector, activeAccountAddressSelector } from 'selectors';

// Utils
import { getBalance } from 'utils/assets';
import { BigNumber, formatFullAmount, formatTokenAmount, humanizeHexString } from 'utils/common';
import { appFont, fontStyles, spacing } from 'utils/variables';

// Types
import type { KeyBasedAssetTransfer } from 'models/Asset';

const KeyBasedAssetTransferConfirm = () => {
  const { t, tRoot } = useTranslationWithPrefix('smartWalletContent.confirm');
  const navigation = useNavigation();

  const keyBasedAssetsToTransfer = useRootSelector((root) => root.keyBasedAssetTransfer.data);
  const availableBalances = useRootSelector((root) => root.keyBasedAssetTransfer.availableBalances);
  const isCalculatingGas = useRootSelector(root => root.keyBasedAssetTransfer.isCalculatingGas);

  const activeAccountAddress = useRootSelector(activeAccountAddressSelector);
  const keyBasedWalletAddress = useRootSelector(root => root.wallet.data?.address);

  const renderItem = ({ assetData, amount }: KeyBasedAssetTransfer, index: number) => {
    if (assetData.tokenType === COLLECTIBLES) {
      return <Form.Item title={assetData.name} value={tRoot('label.collectible')} separator={index !== 0} />;
    }

    return (
      <Form.Item
        title={assetData.name}
        value={`${formatTokenAmount(amount ?? 0, assetData.token)} ${assetData.token}`}
        fontVariant="tabular-nums"
        separator={index !== 0}
      />
    );
  };

  return (
    <ContainerWithHeader headerProps={{ centerItems: [{ title: t('title') }] }}>
      <Content>
        <Form.Header>{t('details.header')}</Form.Header>
        <Form.Item
          title={t('details.fromKeyWallet')}
          value={humanizeHexString(keyBasedWalletAddress)}
          fontVariant="tabular-nums"
          separator={false}
        />
        <Form.Item
          title={t('details.toSmartWallet')}
          value={humanizeHexString(activeAccountAddress)}
          fontVariant="tabular-nums"
        />

        <Form.Header>{t('assets.header')}</Form.Header>
        {keyBasedAssetsToTransfer.map(renderItem)}

        <Form.Header>{t('fees.header')}</Form.Header>
        <Form.Item title={t('fees.ethereum')} value={''} separator={false} />
        <Form.Item title={t('fees.pillar')} value={tRoot('label.free')} variant="positive" />
        <Form.Item title={t('fees.total')} value={''} />
      </Content>
    </ContainerWithHeader>
  );
};

export default KeyBasedAssetTransferConfirm;

const Content = styled.View`
  padding: 0 ${spacing.large}px;
`;
