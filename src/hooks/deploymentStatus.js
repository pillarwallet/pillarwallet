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

// Components
import Modal from 'components/Modal';
import SWActivationModal from 'components/SWActivationModal';

// Constants
import { ETHERSPOT_DEPLOYMENT_INTERJECTION } from 'constants/navigationConstants';

// Selectors
import { useRootSelector, useActiveAccount } from 'selectors';
import { isDeployedOnChainSelector } from 'selectors/chains';

// Utils
import { isArchanovaAccount, isEtherspotAccount } from 'utils/accounts';

// Types
import { type Chain } from 'models/Chain';

export function useDeploymentStatus() {
  const navigation = useNavigation();
  const activeAccount = useActiveAccount();

  const isDeployedOnChain = useRootSelector(isDeployedOnChainSelector);

  const showDeploymentInterjection = React.useCallback(
    (chain: Chain) => {
      if (isEtherspotAccount(activeAccount)) {
        navigation.navigate(ETHERSPOT_DEPLOYMENT_INTERJECTION, { chain });
      } else if (isArchanovaAccount(activeAccount)) {
        Modal.open(() => <SWActivationModal navigation={navigation} />);
      }
    },
    [navigation, activeAccount],
  );

  return {
    isDeployedOnChain,
    showDeploymentInterjection,
  };
}
