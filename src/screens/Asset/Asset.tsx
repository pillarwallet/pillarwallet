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
import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import t from 'translations/translate';
import { useNavigation, useNavigationParam } from 'react-navigation-hooks';

// Components
import { Container, Content } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import TokenIcon from 'components/display/TokenIcon';
import { Spacing } from 'components/legacy/Layout';

// Utils
import { useChainConfig } from 'utils/uiConfig';

// models, types
import type { AssetDataNavigationParam } from 'models/Asset';

// Local
import { HeaderLoader, GraphLoader } from './components/Loaders';
import DurationSelection from './components/DurationSelection';
import YourBalanceContent from './components/YourBalanceContent';
import TokenAnalytics from './components/TokenAnalytics';
import AnimatedGraph from 'components/AnimatedGraph';

const AssetScreen = () => {
  const navigation = useNavigation();

  const assetData: AssetDataNavigationParam = useNavigationParam('assetData');
  const { chain, imageUrl } = assetData;

  const config = useChainConfig(chain);

  const [graphLoader, setGraphLoader] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setGraphLoader(false);
    }, 2000);
  }, []);

  const networkName = chain ? config.title : undefined;

  return (
    <Container>
      <HeaderBlock
        centerItems={[
          {
            custom: <TokenIcon url={imageUrl} chain={chain} size={24} />,
          },
          { title: ` ${assetData.name} ${t('label.on_network', { network: networkName })}` },
        ]}
        customOnBack={() => navigation.goBack()}
        noPaddingTop
      />
      <Content bounces={false} paddingHorizontal={0} paddingVertical={0}>
        <Container style={{ alignItems: 'center' }}>
          <Spacing h={20} />
          <HeaderLoader />
          {graphLoader ? (
            <>
              <Spacing h={20} />
              <GraphLoader />
            </>
          ) : (
            <AnimatedGraph />
          )}

          <Spacing h={20} />
          <DurationSelection />
          <Spacing h={20} />
          <YourBalanceContent />
          <Spacing h={36} />
          <TokenAnalytics />
        </Container>
      </Content>
    </Container>
  );
};

export default AssetScreen;
