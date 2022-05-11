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
import { StyleSheet } from 'react-native';

// Utils
import { chainFromChainId } from 'utils/chains';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import BigNumberInput from 'components/inputs/BigNumberInput';

// Services
import etherspotService from 'services/etherspot';

function NIViewService() {
  const navigation = useNavigation();
  const action = navigation.getParam('action');
  const contractData = navigation.getParam('contractData');
  const title = action?.['action-name'][0]?.text;
  const actionName = action?.['action-contract-call'];
  const chain = chainFromChainId[contractData?.chain_id];
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    FetchData();
  });

  const FetchData = async () => {
    if (!chain) return;

    const integrationContract = etherspotService.getContract(chain, contractData?.abi, contractData?.contract_address);

    const fnName = actionName ? `call${actionName[0].toUpperCase()}${actionName.substring(1)}` : ``;

    const contractResponse = await integrationContract?.[fnName]();
    contractResponse?._isBigNumber ? setValue(contractResponse?.toNumber()) : setValue(contractResponse);
  };

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: title ? title : '' }]} navigation={navigation} />
      <BigNumberInput value={value} onValueChange={setValue} editable={false} style={[styles.input]} />
    </Container>
  );
}

export default NIViewService;

const styles = StyleSheet.create({
  input: {
    alignSelf: 'center',
  },
});
