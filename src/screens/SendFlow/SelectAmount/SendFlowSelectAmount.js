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
import { useNavigation } from 'react-navigation-hooks';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';

// Utils
import { getContactTitle } from 'utils/contacts';

// Types
import type { AssetOption } from 'models/Asset';
import type { Collectible } from 'models/Collectible';
import type { Contact } from 'models/Contact';

// Local
import AssetSelector from './AssetSelector';

const SendFlowSelectAmount = () => {
  const { t } = useTranslationWithPrefix('sendFlow.selectAmount');
  const navigation = useNavigation();

  const contact: Contact = navigation.getParam('contact');
  const initialToken: AssetOption = navigation.getParam('token');
  const initialCollectible: Collectible = navigation.getParam('collectible');

  const [selectedToken, setSelectedToken] = React.useState(initialToken);
  const [selectedCollectible, setSelectedCollectible] = React.useState(initialCollectible);
  const [value, setValue] = React.useState(null);

  const title = t('title', { recipient: getContactTitle(contact) });

  return (
    <Container>
      <HeaderBlock centerItems={[{ title }]} navigation={navigation} noPaddingTop />

      <AssetSelector
        selectedToken={selectedToken}
        onSelectToken={setSelectedToken}
        selectedCollectible={selectedCollectible}
        onSelectCollectible={setSelectedCollectible}
        value={value}
        onValueChange={setValue}
        txFeeInfo={null}
      />
    </Container>
  );
};

export default SendFlowSelectAmount;
