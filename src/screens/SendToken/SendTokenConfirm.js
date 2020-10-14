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
import { Keyboard } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import t from 'translations/translate';

// constants
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';

// components
import Table, { TableRow, TableLabel, TableAmount, TableTotal, TableUser, TableFee } from 'components/Table';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import Button from 'components/Button';
import { Spacing, ScrollWrapper } from 'components/Layout';
import TokenReviewSummary from 'components/ReviewSummary/TokenReviewSummary';

// types
import type { RootReducerState } from 'reducers/rootReducer';


type Props = {
  navigation: NavigationScreenProp<*>,
  session: Object,
};

class SendTokenConfirm extends React.Component<Props> {
  source: string;

  constructor(props) {
    super(props);
    this.source = this.props.navigation.getParam('source', '');
  }

  handleFormSubmit = () => {
    Keyboard.dismiss();
    const { navigation } = this.props;
    const transactionPayload = { ...navigation.getParam('transactionPayload', {}) };
    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      source: this.source,
    });
  };

  render() {
    const {
      session,
      navigation,
    } = this.props;
    const {
      amount,
      to,
      receiverEnsName,
      txFeeInWei,
      symbol,
      gasToken,
    } = navigation.getParam('transactionPayload', {});

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: t('transactions.title.review') }],
        }}
      >
        <ScrollWrapper
          disableAutomaticScroll
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 }}
          disableOnAndroid
        >
          <TokenReviewSummary assetSymbol={symbol} text={t('transactions.label.youAreSending')} amount={amount} />
          <Spacing h={32} />
          <Table>
            <TableRow>
              <TableLabel>{t('transactions.label.recipient')}</TableLabel>
              <TableUser ensName={receiverEnsName} address={to} />
            </TableRow>
            <TableRow>
              <TableLabel>{t('transactions.label.ethFee')}</TableLabel>
              <TableFee txFeeInWei={txFeeInWei} gasToken={gasToken} />
            </TableRow>
            <TableRow>
              <TableLabel>{t('transactions.label.pillarFee')}</TableLabel>
              <TableAmount amount={0} />
            </TableRow>
            <TableRow>
              <TableTotal>{t('transactions.label.totalFee')}</TableTotal>
              <TableFee txFeeInWei={txFeeInWei} gasToken={gasToken} />
            </TableRow>
          </Table>
          <Spacing h={40} />
          <Button
            disabled={!session.isOnline}
            onPress={this.handleFormSubmit}
            title={t('transactions.button.send')}
          />
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
}: RootReducerState): $Shape<Props> => ({
  session,
});

export default connect(mapStateToProps)(SendTokenConfirm);
