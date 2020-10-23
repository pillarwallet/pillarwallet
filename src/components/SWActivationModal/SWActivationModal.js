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
import { SafeAreaView } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import t from 'translations/translate';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import type { NavigationScreenProp } from 'react-navigation';

// actions
import { deploySmartWalletAction, estimateSmartWalletDeploymentAction } from 'actions/smartWalletActions';

// components
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import { MediumText, BaseText } from 'components/Typography';
import { Spacing } from 'components/Layout';
import FeeLabelToggle from 'components/FeeLabelToggle';

// constants
import { ASSETS } from 'constants/navigationConstants';
import { ETH } from 'constants/assetsConstants';
import { FEATURE_FLAGS } from 'constants/featureFlagsConstants';

// utils
import { images } from 'utils/images';
import { buildTxFeeInfo } from 'utils/smartWallet';
import { isEnoughBalanceForTransactionFee } from 'utils/assets';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// selectors
import { accountBalancesSelector } from 'selectors/balances';

// types
import type { Theme } from 'models/Theme';
import type { Balances } from 'models/Asset';
import type { EstimatedTransactionFee } from 'models/Transaction';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';


type Props = {
  theme: Theme,
  isVisible: Boolean,
  onClose: () => void,
  navigation: NavigationScreenProp<*>,
  deploymentEstimate: ?{ raw: Object, formatted: EstimatedTransactionFee },
  gettingDeploymentEstimate: boolean,
  balances: Balances,
  isOnline: boolean,
  deploySmartWallet: () => void,
  estimateSmartWalletDeployment: () => void,
};

const ModalContainer = styled.View`
  padding: 20px 0 40px;
`;

const Centered = styled.View`
  align-items: center;
`;

const SWActivationModal = ({
  theme,
  isVisible,
  onClose,
  navigation,
  deploymentEstimate,
  gettingDeploymentEstimate,
  balances,
  isOnline,
  deploySmartWallet,
  estimateSmartWalletDeployment,
}: Props) => {
  const paidByPillar = firebaseRemoteConfig.getBoolean(FEATURE_FLAGS.SMART_WALLET_ACTIVATION_PAID_BY_PILLAR);

  useEffect(() => {
    if (!paidByPillar && isVisible) {
      estimateSmartWalletDeployment();
    }
  }, [isVisible]);

  const { smartWalletIcon } = images(theme);

  const txFeeInfo = buildTxFeeInfo(deploymentEstimate?.formatted, false);
  const isEnoughETH = paidByPillar || (
    txFeeInfo?.fee && isEnoughBalanceForTransactionFee(balances, { txFeeInWei: txFeeInfo.fee })
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
    deploySmartWallet();
    navigation.navigate(ASSETS);
    if (onClose) onClose();
  };

  return (
    <SlideModal
      isVisible={isVisible}
      onModalHide={onClose}
      hideHeader
    >
      <SafeAreaView>
        <ModalContainer>
          <MediumText center medium>{t('smartWalletContent.activationModal.title')}</MediumText>
          <Spacing h={18} />
          <CachedImage
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
                isLoading={gettingDeploymentEstimate}
                showFiatDefault
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
}: RootReducerState): $Shape<Props> => ({
  deploymentEstimate,
  gettingDeploymentEstimate,
  isOnline,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  deploySmartWallet: () => dispatch(deploySmartWalletAction()),
  estimateSmartWalletDeployment: () => dispatch(estimateSmartWalletDeploymentAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(SWActivationModal));
