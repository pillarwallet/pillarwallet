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

import React, { useCallback, useMemo, useEffect } from 'react';
import type { AbstractComponent } from 'react';
import { Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { withNavigation } from 'react-navigation';
import t from 'translations/translate';

// components
import Modal from 'components/Modal';
import ActionOptionsModal from 'components/ActionModal/ActionOptionsModal';
import ReceiveModal from 'screens/Asset/ReceiveModal';
import RetryGraphQueryBox from 'components/RetryGraphQueryBox';

// constants
import { EXCHANGE, SERVICES } from 'constants/navigationConstants';
import { ETH } from 'constants/assetsConstants';

// actions
import { getExchangeSupportedAssetsAction } from 'actions/exchangeActions';
import { goToInvitationFlowAction } from 'actions/referralsActions';

import type { RootReducerState } from 'reducers/rootReducer';

type OwnProps = {|
  token?: string,
  receiveAddress: string,
|};

type Props = {|
  ...OwnProps,
  navigation: $FlowFixMe,
|};

const exchangeSupportedAssetsSelector = ({
  exchange: {
    exchangeSupportedAssets,
    isFetchingUniswapTokens,
    uniswapTokensGraphQueryFailed,
  },
}: RootReducerState) => ({
  exchangeSupportedAssets,
  isFetchingUniswapTokens,
  uniswapTokensGraphQueryFailed,
});

const rewardActiveSelector = ({
  referrals: { isPillarRewardCampaignActive: rewardActive },
}: RootReducerState) => rewardActive;

const AddFundsModal = ({ token, receiveAddress, navigation }: Props) => {
  const dispatch = useDispatch();
  const {
    exchangeSupportedAssets,
    isFetchingUniswapTokens,
    uniswapTokensGraphQueryFailed,
  } = useSelector(exchangeSupportedAssetsSelector);
  const rewardActive = useSelector(rewardActiveSelector);

  const isSupportedByExchange = useMemo(() =>
    !!token && exchangeSupportedAssets.some(({ symbol }) => symbol === token),
  [exchangeSupportedAssets, token]);

  useEffect(() => {
    if (exchangeSupportedAssets.length === 0) {
      dispatch(getExchangeSupportedAssetsAction());
    }
  }, [dispatch, exchangeSupportedAssets.length]);

  const openReceiveModal = useCallback(() => {
    Modal.open(() => (
      <ReceiveModal
        address={receiveAddress}
        showErc20Note={!!token && token !== ETH}
      />
    ));
  }, [token, receiveAddress]);

  const hideExchangeOption = !!token && !isSupportedByExchange;

  const options = [
    {
      key: 'buy',
      label: Platform.OS === 'ios' ? t('button.buyWithCardOrApplePay') : t('button.buyWithCard'),
      iconName: 'wallet',
      onPress: () => navigation.navigate(SERVICES),
    },
    {
      key: 'receive',
      label: t('button.sendFromAnotherWallet'),
      iconName: 'qrDetailed',
      onPress: openReceiveModal,
    },
    {
      key: 'exchange',
      label: t('button.exchange'),
      iconName: 'flip',
      onPress: () => navigation.navigate(EXCHANGE, token && { toAssetCode: token }),
      hide: hideExchangeOption,
    },
    {
      key: 'invite',
      label: t('button.inviteAndGetTokens'),
      iconName: 'present',
      hide: !rewardActive,
      onPress: () => dispatch(goToInvitationFlowAction()),
    },
  ];

  const retryBox = (
    <RetryGraphQueryBox
      message={t('error.theGraphQueryFailed.isTokenSupportedByUniswap')}
      hasFailed={hideExchangeOption && uniswapTokensGraphQueryFailed}
      isFetching={isFetchingUniswapTokens}
      onRetry={() => dispatch(getExchangeSupportedAssetsAction())}
    />
  );

  return (
    <ActionOptionsModal
      items={options}
      title={t('title.addFundsToWallet')}
      footer={retryBox}
    />
  );
};

export default (withNavigation(AddFundsModal): AbstractComponent<OwnProps>);
