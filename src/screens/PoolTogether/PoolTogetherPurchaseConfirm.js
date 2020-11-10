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
import { RefreshControl } from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { CachedImage } from 'react-native-cached-image';
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';

// actions
import { logScreenViewAction } from 'actions/analyticsActions';
import { fetchPoolPrizeInfo } from 'actions/poolTogetherActions';

// constants
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { POOLTOGETHER_DEPOSIT_TRANSACTION } from 'constants/poolTogetherConstants';

// components
import { ScrollWrapper, Spacing } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText, MediumText } from 'components/Typography';
import Button from 'components/Button';
import Table, { TableRow, TableLabel, TableAmount, TableTotal, TableFee } from 'components/Table';
import Toast from 'components/Toast';

// models
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Asset } from 'models/Asset';
import type { TransactionFeeInfo } from 'models/Transaction';

// utils
import { formatAmount } from 'utils/common';
import { getWinChance } from 'utils/poolTogether';


const ContentWrapper = styled.View`
  padding: 16px 20px;
`;

const TokenImage = styled(CachedImage)`
  width: 64px;
  height: 64px;
`;

const Center = styled.View`
  align-items: center;
`;


type Props = {
  name: string,
  navigation: NavigationScreenProp<*>,
  session: Object,
  logScreenView: (view: string, screen: string) => void,
  fetchPoolStats: (symbol: string) => void,
  supportedAssets: Asset[],
  feeInfo: ?TransactionFeeInfo,
};

type State = {
  poolToken: string,
  tokenValue: number,
  userTickets: number,
  totalPoolTicketsCount: number,
  transactionPayload: Object,
};

class PoolTogetherPurchaseConfirm extends React.Component<Props, State> {
  scroll: Object;

  constructor(props) {
    const { navigation } = props;
    const {
      poolToken,
      tokenValue,
      userTickets,
      totalPoolTicketsCount,
      transactionPayload,
    } = navigation.state.params || {};
    super(props);
    this.state = {
      poolToken,
      tokenValue,
      userTickets,
      totalPoolTicketsCount,
      transactionPayload,
    };
  }

  componentDidMount() {
    const { logScreenView } = this.props;
    logScreenView('View PoolTogether Purchase Confirm', 'PoolTogetherPurchaseConfirm');
  }

  purchasePoolAsset = () => {
    const { navigation, feeInfo } = this.props;
    const { transactionPayload } = this.state;

    if (!feeInfo) {
      Toast.show({
        message: t('toast.cannotPurchaseTicket'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });
      return;
    }

    const { fee: txFeeInWei, gasToken } = feeInfo;

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload: { ...transactionPayload, txFeeInWei, gasToken },
      transactionType: POOLTOGETHER_DEPOSIT_TRANSACTION,
    });
  };

  render() {
    const { fetchPoolStats, supportedAssets, feeInfo } = this.props;

    const {
      poolToken,
      tokenValue,
      userTickets,
      totalPoolTicketsCount,
    } = this.state;

    const asset = supportedAssets.find(({ symbol }) => poolToken === symbol);
    const iconUrl = asset?.iconUrl;
    const assetIcon = iconUrl ? `${getEnv().SDK_PROVIDER}/${iconUrl}?size=3` : null;

    const winChance = getWinChance(tokenValue + userTickets, totalPoolTicketsCount);

    return (
      <ContainerWithHeader
        inset={{ bottom: 'never' }}
        headerProps={{ centerItems: [{ title: t('poolTogetherContent.title.purchaseConfirmScreen') }] }}
      >
        <ScrollWrapper
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                fetchPoolStats(poolToken);
              }}
            />
          }
          innerRef={ref => { this.scroll = ref; }}
        >
          <ContentWrapper>
            <Center>
              <TokenImage source={{ uri: assetIcon }} />
              <Spacing h={16} />
              <BaseText regular>{t('poolTogetherContent.label.youArePurchasing')}</BaseText>
              <Spacing h={16} />
              <MediumText giant>
                {t('poolTogetherContent.label.ticketsReview', {
                  count: tokenValue,
                  mediumText: true,
                  secondary: true,
                  fontSize: 20,
                })}
              </MediumText>
              <Spacing h={7} />
              <BaseText secondary small>{tokenValue} {poolToken}</BaseText>
            </Center>
            <Spacing h={42} />
            <Table>
              <TableRow>
                <TableLabel>{t('poolTogetherContent.label.chanceOfWin')}</TableLabel>
                <MediumText>{t('percentValue', { value: formatAmount(winChance, 6) })}</MediumText>
              </TableRow>
              <TableRow>
                <TableLabel>{t('transactions.label.ethFee')}</TableLabel>
                <TableFee txFeeInWei={feeInfo?.fee} gasToken={feeInfo?.gasToken} />
              </TableRow>
              <TableRow>
                <TableLabel>{t('transactions.label.pillarFee')}</TableLabel>
                <TableAmount amount={0} />
              </TableRow>
              <TableRow>
                <TableTotal>{t('transactions.label.totalFee')}</TableTotal>
                <TableFee txFeeInWei={feeInfo?.fee} gasToken={feeInfo?.gasToken} />
              </TableRow>
            </Table>
            <Spacing h={50} />
            <Button
              title={t('poolTogetherContent.button.purchaseTickets')}
              onPress={() => {
                this.purchasePoolAsset();
              }}
              style={{ marginBottom: 13, width: '100%' }}
            />
          </ContentWrapper>
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  assets: { supportedAssets },
  transactionEstimate: { feeInfo },
}: RootReducerState): $Shape<Props> => ({
  session,
  supportedAssets,
  feeInfo,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  fetchPoolStats: (symbol: string) => dispatch(fetchPoolPrizeInfo(symbol)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PoolTogetherPurchaseConfirm);
