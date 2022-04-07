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
import { useTranslation } from 'translations/translate';

// Utils
import { isArchanovaAccount } from 'utils/accounts';
import { chainFromChainId } from 'utils/chains';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import DropdownChainView from 'components/ChainView/DropdownChainView';
import Modal from 'components/Modal';

// Selectors
import { useRootSelector, useActiveAccount } from 'selectors';
import { nativeIntegrationSelector } from 'redux/selectors/native-integration-selector';

// Types
import { Chain } from 'models/Chain';
import ContractItemContent from './components/ContractItemContent';
import ContractActionsModal from './components/ContractActionsModal';

// Constants
import { NI_VIEW_SERVICE, NI_INPUT_SERVICE } from 'constants/navigationConstants';

function NIServices() {
  const nativeIntegrationResponse = useRootSelector(nativeIntegrationSelector);
  const { t } = useTranslation();
  const navigation = useNavigation();
  const activeAccount = useActiveAccount();
  const [contractList, setContractList]: any[] = React.useState([]);

  React.useEffect(() => {
    updateChain(null);
  }, []);

  const updateChain = (chain: Chain | null) => {
    if (chain === null) setContractList(nativeIntegrationResponse);
    else {
      const list = nativeIntegrationResponse?.filter((fnRes: any) => chainFromChainId[fnRes?.data?.chain_id] === chain);
      setContractList(list);
    }
  };

  const openActionsModal = (item: any) => {
    Modal.open(() => {
      return <ContractActionsModal items={item} onSelectItem={(val) => onSelectItem(item, val)} />;
    });
  };

  const onSelectItem = (item, val) => {
    const abi = item?.data?.abi;
    const type = JSON.parse(abi)?.find((fnRes) => fnRes.name === val?.['action-contract-call'])?.stateMutability;

    if (type === 'view' || type === 'pure')
      navigation.navigate(NI_VIEW_SERVICE, { action: val, contractData: item?.data });
    if (type === 'nonpayable' || type === 'payable')
      navigation.navigate(NI_INPUT_SERVICE, { action: val, contractData: item?.data });
  };

  return (
    <Container>
      <HeaderBlock
        leftItems={[{ close: true }]}
        centerItems={[{ title: t('home.apps.title') }]}
        navigation={navigation}
      />
      {!isArchanovaAccount(activeAccount) && <DropdownChainView selectedChain={updateChain} />}
      {contractList?.map((res: Object) => (
        <ContractItemContent item={res} onPress={() => openActionsModal(res)} />
      ))}
    </Container>
  );
}

export default NIServices;
