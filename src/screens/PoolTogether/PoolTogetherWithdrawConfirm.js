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
import { RefreshControl, Platform } from 'react-native';
import { connect } from 'react-redux';
import styled, { withTheme } from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// actions
import { logScreenViewAction } from 'actions/analyticsActions';
import { fetchPoolPrizeInfo } from 'actions/poolTogetherActions';

// constants
import { SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { POOLTOGETHER_WITHDRAW_TRANSACTION } from 'constants/poolTogetherConstants';

// components
import { ScrollWrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';

// models
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';

// selectors
import { accountHistorySelector } from 'selectors/history';

// utils
import { themedColors } from 'utils/themes';
import { fontStyles } from 'utils/variables';

// local components
import PoolTogetherWithdrawScheme from './PoolTogetherWithdrawScheme';


const ContentWrapper = styled.View`
  padding-top: ${Platform.select({
    ios: '25px',
    android: '19px',
  })};
  flex: 1;
  justify-content: center;
`;

const Text = styled(BaseText)`
  ${({ label }) => label ? fontStyles.regular : fontStyles.large};
  letter-spacing: 0.18px;
  color: ${({ label }) => label ? themedColors.secondaryText : themedColors.text};
`;

const ContentRow = styled.View`
  flex-direction: row;
  justify-content: center;
  padding: 8px 20px 8px 20px;
`;

type Props = {
  name: string,
  navigation: NavigationScreenProp<*>,
  session: Object,
  logScreenView: (view: string, screen: string) => void,
  fetchPoolStats: (symbol: string) => void,
  theme: Theme,
  user: Object,
};

type State = {
  poolToken: string,
  tokenValue: number,
  tokenValueInFiat: string,
  transactionPayload: Object,
  feeInFiat: string,
  feeDisplayValue: string,
  isDisabled: boolean,
};

const poolTogetherLogo = require('assets/images/pool_together.png');

class PoolTogetherWithdrawConfirm extends React.Component<Props, State> {
  scroll: Object;

  constructor(props) {
    const { navigation } = props;
    const {
      poolToken,
      tokenValue,
      tokenValueInFiat,
      transactionPayload,
      feeInFiat,
      feeDisplayValue,
      isDisabled,
    } = navigation.state.params || {};
    super(props);
    this.state = {
      poolToken,
      tokenValue,
      tokenValueInFiat,
      transactionPayload,
      feeInFiat,
      feeDisplayValue,
      isDisabled,
    };
  }

  componentDidMount() {
    const { logScreenView } = this.props;
    logScreenView('View PoolTogether Withdraw Confirm', 'PoolTogetherWithdrawConfirm');
  }

  withdrawPoolAsset = () => {
    const { navigation } = this.props;
    const { transactionPayload } = this.state;

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      goBackDismiss: true,
      transactionType: POOLTOGETHER_WITHDRAW_TRANSACTION,
    });
  };

  render() {
    const {
      fetchPoolStats,
      user,
    } = this.props;

    const {
      poolToken,
      tokenValue,
      tokenValueInFiat,
      feeDisplayValue,
      feeInFiat,
      isDisabled,
    } = this.state;

    return (
      <ContainerWithHeader
        inset={{ bottom: 'never' }}
        headerProps={{ centerItems: [{ title: t('poolTogetherContent.title.withdrawConfirmScreen') }] }}
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
            <PoolTogetherWithdrawScheme
              toValue={tokenValue}
              toValueInFiat={tokenValueInFiat}
              toAssetCode={poolToken}
              imageSource={poolTogetherLogo}
              user={user}
            />
            <ContentRow style={{ paddingTop: 64 }}>
              <Text label>{t('label.feeTokenFiat', { tokenValue: feeDisplayValue, fiatValue: feeInFiat })}</Text>
            </ContentRow>
            <ContentRow style={{ paddingTop: 16 }}>
              <Button
                title={t('button.confirmWithdraw')}
                onPress={() => {
                  this.withdrawPoolAsset();
                }}
                style={{ marginBottom: 13, width: '100%' }}
                disabled={isDisabled}
              />
            </ContentRow>
          </ContentWrapper>
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  session: { data: session },
  user: { data: user },
}: RootReducerState): $Shape<Props> => ({
  session,
  user,
});

const structuredSelector = createStructuredSelector({
  history: accountHistorySelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  fetchPoolStats: (symbol: string) => dispatch(fetchPoolPrizeInfo(symbol)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(withTheme(PoolTogetherWithdrawConfirm));
