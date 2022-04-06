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
import styled from 'styled-components/native';

// Utils
import { isArchanovaAccount } from 'utils/accounts';
import { spacing, borderRadiusSizes, appFont } from 'utils/variables';
import { chainFromChainId } from 'utils/chains';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import DropdownChainView from 'components/ChainView/DropdownChainView';
import Icon from 'components/core/Icon';

// Selectors
import { useRootSelector, useActiveAccount } from 'selectors';
import { nativeIntegrationSelector } from 'redux/selectors/native-integration-selector';

// Types
import { Chain } from 'models/Chain';
import ContractItemContent from './components/ContractItemContent';

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

  return (
    <Container>
      <HeaderBlock
        leftItems={[{ close: true }]}
        centerItems={[{ title: t('home.apps.title') }]}
        navigation={navigation}
      />
      {!isArchanovaAccount(activeAccount) && <DropdownChainView selectedChain={updateChain} />}
      {contractList?.map((fnRes) => (
        <ContractItemContent item={fnRes} />
      ))}
    </Container>
  );
}

export default NIServices;

const styles = {
  titleStyle: {
    fontFamily: appFont.medium,
  },
};

const RowContainer = styled.View`
  align-items: center;
  justify-content: center;
  flex-direction: row;
`;

const RadioIcon = styled(Icon)`
  height: 24px;
  width: 24px;
  background-color: ${({ theme }) => theme.colors.basic050};
  border-radius: ${borderRadiusSizes.medium}px;
  padding-right: ${spacing.medium}px;
  margin-right: ${spacing.medium}px;
`;

const ContentView = styled.View`
  flex: 1;
  padding: 0 ${spacing.medium}px 0 ${spacing.medium}px;
`;

/**
 *   <RowContainer>
        {isSideChains && <RadioIcon name="checked-radio" />}
        {!isSideChains && <RadioIcon name="unchecked-radio" />}
        <ContentView>
          <Text variant="big" style={isSideChains && styles.titleStyle}>
            {'NI example'}
          </Text>
          <Text color={colors.tertiaryText}>{'store and retrieve'}</Text>
        </ContentView>
        <Text>{"t('options.recommended')"}</Text>
      </RowContainer>
 */
