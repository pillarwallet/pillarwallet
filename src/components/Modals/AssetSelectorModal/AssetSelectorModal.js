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

import * as React from 'react';
import { Keyboard, Modal as RNModal } from 'react-native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import Modal from 'components/Modal';

// Utils
import { useThemeColors } from 'utils/themes';
import { useChainConfig } from 'utils/uiConfig';

// Types
import type { AssetOption } from 'models/Asset';
import type { Collectible } from 'models/Collectible';
import type { Chain } from 'models/Chain';

// constants
import { CHAIN } from 'constants/chainConstants';

// Local
import AssetSelectorContent from './AssetSelectorContent';

type Props = {|
  visible?: boolean,
  onCloseModal?: (val: boolean) => void,
  tokens: AssetOption[],
  onSelectToken: (asset: AssetOption) => mixed,
  collectibles?: Collectible[],
  onSelectCollectible?: (collectible: Collectible) => mixed,
  title?: string,
  autoFocus?: boolean,
  chain?: Chain | null,
  searchTokenList?: any,
|};

const AssetSelectorModal = ({
  visible = true,
  onCloseModal,
  tokens,
  collectibles,
  onSelectToken,
  onSelectCollectible,
  title,
  autoFocus = false,
  chain,
  searchTokenList,
}: Props) => {
  const { t } = useTranslationWithPrefix('assetSelector');
  const colors = useThemeColors();
  const [selectedAssetChain, setSelectedAssetChain] = React.useState(chain);

  const close = () => {
    if (onCloseModal) {
      onCloseModal(false);
    } else {
      Modal.closeAll();
    }
    Keyboard.dismiss();
  };

  const selectToken = (option: AssetOption) => {
    close();
    onSelectToken(option);
  };

  const selectCollectible = (collectible: Collectible) => {
    close();
    onSelectCollectible?.(collectible);
  };

  const config = useChainConfig(selectedAssetChain || CHAIN.ETHEREUM);

  title = (selectedAssetChain ? t('choose_token', { chain: config?.titleShort }) : title) || t('title');

  return (
    // eslint-disable-next-line i18next/no-literal-string
    <RNModal animationType="slide" visible={visible} style={{ backgroundColor: colors.basic050 }}>
      <Container>
        <HeaderBlock leftItems={[{ close: true }]} centerItems={[{ title }]} onClose={close} noPaddingTop />

        <AssetSelectorContent
          tokens={tokens}
          selectedAssetChain={selectedAssetChain}
          onSelectAssetChain={setSelectedAssetChain}
          onSelectToken={selectToken}
          collectibles={collectibles}
          onSelectCollectible={selectCollectible}
          autoFocus={autoFocus}
          searchTokenList={searchTokenList}
        />
      </Container>
    </RNModal>
  );
};

export default AssetSelectorModal;
