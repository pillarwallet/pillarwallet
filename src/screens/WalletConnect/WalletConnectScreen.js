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
import { ScrollView } from 'react-native';
import t from 'translations/translate';

import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import PromoCard from './PromoCard';
import QRCodeScanButton from './QRCodeScanButton';
import ActiveConnections from './ActiveConnections';
import Requests from './Requests';
import { connect } from 'react-redux';
import type { RootReducerState } from 'reducers/rootReducer';

type Props = {
  sessionLanguageCode: ?string, // important for re-rendering on language change
};

const WalletConnectScreen = ({ sessionLanguageCode }: Props) => (
  <ContainerWithHeader
    headerProps={{ noBack: true, leftItems: [{ title: t('walletConnectContent.title.connect') }] }}
    inset={{ bottom: 0 }}
    tab
  >
    {onScroll => (
      <ScrollView onScroll={onScroll} scrollEventThrottle={16}>
        <PromoCard sessionLanguageCode={sessionLanguageCode} />
        <Requests sessionLanguageCode={sessionLanguageCode} />
        <QRCodeScanButton sessionLanguageCode={sessionLanguageCode} />
        <ActiveConnections sessionLanguageCode={sessionLanguageCode} />
      </ScrollView>
    )}
  </ContainerWithHeader>
);


const mapStateToProps = ({
  session: { data: { sessionLanguageCode } },
}: RootReducerState): $Shape<Props> => ({
  sessionLanguageCode,
});

export default connect(mapStateToProps)(WalletConnectScreen);
