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
import { useNavigation } from 'react-navigation-hooks';
import { SectionList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import BalanceView from 'components/BalanceView';
import BottomModal from 'components/modern/BottomModal';
import FiatValueView from 'components/modern/FiatValueView';
import FloatingButtons from 'components/FloatingButtons';
import Modal from 'components/Modal';

import { CHAINS } from 'constants/assetsConstants';
import { LENDING_ADD_DEPOSIT_FLOW, RARI_DEPOSIT } from 'constants/navigationConstants';

// Selectors
import { useRootSelector, useFiatCurrency } from 'selectors';
import { depositsBalanceSelector } from 'selectors/balances';

// Utils
import { spacing } from 'utils/variables';
import { useServicesConfig } from 'utils/uiConfig';

// Types
import type { SectionBase, ImageSource } from 'utils/types/react-native';
import type { Chain } from 'models/Asset';
import { type Service, SERVICE } from 'models/Services';
import type { FiatBalance } from 'models/Value';

// Local
import SectionHeader from '../components/SectionHeader';
import ServiceListItem from '../items/ServiceListItem';
import AssetListItem from '../items/AssetListItem';

const aaveIcon = require('assets/images/apps/aave.png');
const rariIcon = require('assets/images/rari_logo.png');

function DepositsTab() {
  const { t, tRoot } = useTranslationWithPrefix('assets.deposits');
  const navigation = useNavigation();

  const balance = useBalance();
  const sections = useAssetSections();
  const currency = useFiatCurrency();

  const servicesConfig = useServicesConfig();

  const safeArea = useSafeAreaInsets();

  const navigateToServices = () => {
    Modal.open(() => (
      <BottomModal title={t('deposit')}>
        <ServiceListItem
          title={tRoot('services.aave')}
          iconSource={aaveIcon}
          onPress={() => navigation.navigate(LENDING_ADD_DEPOSIT_FLOW)}
        />
        <ServiceListItem
          title={tRoot('services.rari')}
          iconSource={rariIcon}
          onPress={() => navigation.navigate(RARI_DEPOSIT)}
        />
      </BottomModal>
    ));
  };

  const buttons = [{ title: t('deposit'), iconName: 'plus', onPress: navigateToServices }];

  const renderListHeader = () => {
    return (
      <ListHeader>
        <BalanceView balance={balance.value} />
        {!!balance.change && <FiatValueView value={balance.change} currency={currency} mode="change" />}
      </ListHeader>
    );
  };

  const renderSectionHeader = ({ service, chain }: Section) => {
    const { title } = servicesConfig[service];
    return <SectionHeader title={title} chain={chain} />;
  };

  const renderItem = ({ title, iconSource, value, change }: Item) => {
    return <AssetListItem title={title} iconSource={iconSource} value={value} change={change} />;
  };

  return (
    <Container>
      <SectionList
        sections={sections}
        renderSectionHeader={({ section }) => renderSectionHeader(section)}
        renderItem={({ item }) => renderItem(item)}
        ListHeaderComponent={renderListHeader()}
        contentContainerStyle={{ paddingBottom: safeArea.bottom + FloatingButtons.SCROLL_VIEW_BOTTOM_INSET }}
      />

      <FloatingButtons items={buttons} />
    </Container>
  );
}

export default DepositsTab;

type Section = {
  ...SectionBase<Item>,
  chain: Chain,
  service: Service,
};

type Item = {|
  key: string,
  title: string,
  iconSource: ImageSource,
  value: BigNumber,
  change?: BigNumber,
|};

const useBalance = (): FiatBalance => {
  const value = useRootSelector(depositsBalanceSelector);
  return { value };
};

const useAssetSections = (): Section[] => {
  const rari = {
    key: `${SERVICE.RARI}-${CHAINS.ETHEREUM}`,
    chain: CHAINS.ETHEREUM,
    service: SERVICE.RARI,
    data: [{ key: 'rari-1', title: 'Stable pool', iconSource: rariIcon, value: BigNumber(10), change: BigNumber(1.2) }],
  };

  const aave = {
    key: `${SERVICE.AAVE}-${CHAINS.ETHEREUM}`,
    chain: CHAINS.ETHEREUM,
    service: SERVICE.AAVE,
    data: [{ key: 'aave-1', title: 'AAVE Pool 1', iconSource: aaveIcon, value: BigNumber(10), change: BigNumber(1.2) }],
  };

  return [rari, aave].filter((item) => !!item.data.length);
};

const Container = styled.View`
  flex: 1;
`;

const ListHeader = styled.View`
  align-items: center;
  margin: ${spacing.largePlus}px 0;
`;
