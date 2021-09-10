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

import React, { useEffect } from 'react';
import type { AbstractComponent } from 'react';
import { SafeAreaView } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import t from 'translations/translate';
import { connect, useDispatch } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { deploySmartWalletAction, estimateSmartWalletDeploymentAction } from 'actions/smartWalletActions';

// components
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/legacy/Button';
import Image from 'components/Image';
import { MediumText, BaseText } from 'components/legacy/Typography';
import { Spacing } from 'components/legacy/Layout';
import FeeLabelToggle from 'components/FeeLabelToggle';

// constants
import { ASSETS } from 'constants/navigationConstants';
import { ETH } from 'constants/assetsConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';
import { CHAIN } from 'constants/chainConstants';

// utils
import { images } from 'utils/images';
import { isEnoughBalanceForTransactionFee } from 'utils/assets';
import { buildArchanovaTxFeeInfo } from 'utils/archanova';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// selectors
import { accountEthereumWalletAssetsBalancesSelector } from 'selectors/balances';

// types
import type { Theme } from 'models/Theme';
import type { RootReducerState } from 'reducers/rootReducer';
import type { ArchanovaTransactionEstimate } from 'services/archanova';
import type { WalletAssetsBalances } from 'models/Balances';

type StateProps = {|
  deploymentEstimate: ?{ raw: Object, formatted: ArchanovaTransactionEstimate },
  gettingDeploymentEstimate: boolean,
  isOnline: boolean,
  balances: WalletAssetsBalances,
|};

type OwnProps = {|
  navigation: NavigationScreenProp<*>,
|};

type Props = {|
  ...StateProps,
  ...OwnProps,
  theme: Theme,
|};

const ModalContainer = styled.View`
  padding: 20px 0 40px;
`;

const Centered = styled.View`
  align-items: center;
`;

const SWActivationModal = ({
  theme,
  navigation,
  deploymentEstimate,
  gettingDeploymentEstimate,
  balances,
  isOnline,
}: Props) => {
  const paidByPillar = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.SMART_WALLET_ACTIVATION_PAID_BY_PILLAR);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!paidByPillar) {
      dispatch(estimateSmartWalletDeploymentAction());
    }
  }, [paidByPillar, dispatch]);

  const { smartWalletIcon } = images(theme);

  const txFeeInfo = buildArchanovaTxFeeInfo(deploymentEstimate?.formatted, false);
  const isEnoughETH = paidByPillar || (
    txFeeInfo?.fee && isEnoughBalanceForTransactionFee(balances, { txFeeInWei: txFeeInfo.fee }, CHAIN.ETHEREUM)
  );

  const submitButtonDisabled = !isEnoughETH || !isOnline;
  const submitButtonVisible = true;

  let submitButtonTitle = t('button.activate');

  if (gettingDeploymentEstimate) {
    submitButtonTitle = t('label.gettingFee');
  } else if (!isEnoughETH) {
    submitButtonTitle = t('label.notEnoughToken', { token: ETH });
  } else if (!isOnline) {
    submitButtonTitle = t('label.cannotProceedOffline');
  }

  const onSubmitPress = () => {
    if (submitButtonDisabled) return;
    dispatch(deploySmartWalletAction());
    navigation.navigate(ASSETS);
  };

  return (
    <SlideModal hideHeader>
      <SafeAreaView>
        <ModalContainer>
          <MediumText center medium>{t('smartWalletContent.activationModal.title')}</MediumText>
          <Spacing h={18} />
          <Image
            style={{ width: 64, height: 64, alignSelf: 'center' }}
            source={smartWalletIcon}
          />
          <Spacing h={20} />
          <BaseText medium>{t('smartWalletContent.activationModal.paragraph')}</BaseText>
          <Spacing h={34} />
          {!paidByPillar && (
            <Centered>
              <FeeLabelToggle
                labelText={t('label.fee')}
                txFeeInWei={txFeeInfo?.fee}
                gasToken={txFeeInfo?.gasToken}
                chain={CHAIN.ETHEREUM}
                isLoading={gettingDeploymentEstimate}
              />
            </Centered>
          )}
          <Spacing h={34} />
          {submitButtonVisible && (
            <Button
              title={submitButtonTitle}
              disabled={submitButtonDisabled}
              onPress={onSubmitPress}
              secondary
            />
          )}
        </ModalContainer>
      </SafeAreaView>
    </SlideModal>
  );
};

const mapStateToProps = ({
  smartWallet: { upgrade: { gettingDeploymentEstimate, deploymentEstimate } },
  session: { data: { isOnline } },
}: RootReducerState): $Diff<StateProps, { balances: any }> => ({
  deploymentEstimate,
  gettingDeploymentEstimate,
  isOnline,
});

const structuredSelector = createStructuredSelector({
  balances: accountEthereumWalletAssetsBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): StateProps => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

type ExportedComponent = AbstractComponent<OwnProps>;
export default (withTheme(connect(combinedMapStateToProps)(SWActivationModal)): ExportedComponent);
