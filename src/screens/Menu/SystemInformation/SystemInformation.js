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
import { useTranslationWithPrefix } from 'translations/translate';

// Config
import { getEnv } from 'configs/envConfig';

// Components
import { Container, Content } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';

// Local
import InfoItem from './components/InfoItem';


const SystemInformation = () => {
  const { t } = useTranslationWithPrefix('menu.systemInformation');
  const navigation = useNavigation();

  const env = getEnv();

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} />

      <Content>
        <InfoItem title={t('buildNumber')} value={env.BUILD_NUMBER} />
        <InfoItem title={t('environment')} value={env.ENVIRONMENT} />
        <InfoItem title="TX_DETAILS_URL_ETHEREUM" value={env.TX_DETAILS_URL_ETHEREUM} />
        <InfoItem title="TX_DETAILS_URL_POLYGON" value={env.TX_DETAILS_URL_POLYGON} />
        <InfoItem title="TX_DETAILS_URL_BINANCE" value={env.TX_DETAILS_URL_BINANCE} />
        <InfoItem title="TX_DETAILS_URL_XDAI" value={env.TX_DETAILS_URL_XDAI} />
        <InfoItem title="NETWORK_PROVIDER" value={env.NETWORK_PROVIDER} />
        <InfoItem title="COLLECTIBLES_NETWORK" value={env.COLLECTIBLES_NETWORK} />
      </Content>
    </Container>
  );
};

export default SystemInformation;
