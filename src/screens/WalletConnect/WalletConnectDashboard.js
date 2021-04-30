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
import { connect } from 'react-redux';
import type { RootReducerState } from 'reducers/rootReducer';
import t from 'translations/translate';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';

// local components
import WalletConnectDappsPromoCard from './WalletConnectDappsPromoCard';
import WalletConnectQRCodeScanButton from './WalletConnectQRCodeScanButton';
import WalletConnectActiveConnections from './WalletConnectActiveConnections';
import WalletConnectCallRequestList from './WalletConnectCallRequestList';


type Props = {
  sessionLanguageCode: ?string, // important for re-rendering on language change
};

const WalletConnectDashboard = ({ sessionLanguageCode }: Props) => (
  <ContainerWithHeader
    headerProps={{ centerItems: [{ title: t('walletConnectContent.title.connect') }] }}
    inset={{ bottom: 0 }}
    tab
  >
    <ScrollWrapper>
      <WalletConnectDappsPromoCard />
      <WalletConnectCallRequestList sessionLanguageCode={sessionLanguageCode} />
      <WalletConnectQRCodeScanButton sessionLanguageCode={sessionLanguageCode} />
      <WalletConnectActiveConnections sessionLanguageCode={sessionLanguageCode} />
    </ScrollWrapper>
  </ContainerWithHeader>
);

const mapStateToProps = ({
  session: { data: { sessionLanguageCode } },
}: RootReducerState): $Shape<Props> => ({
  sessionLanguageCode,
});

export default connect(mapStateToProps)(WalletConnectDashboard);
