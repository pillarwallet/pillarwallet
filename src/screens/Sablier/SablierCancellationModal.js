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

import React, { useRef } from 'react';
import type { AbstractComponent } from 'react';
import { SafeAreaView } from 'react-navigation';
import { connect } from 'react-redux';
import t from 'translations/translate';
import styled, { withTheme } from 'styled-components/native';
import { createStructuredSelector } from 'reselect';

// constants
import { ETH } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';

// components
import SlideModal from 'components/Modals/SlideModal';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import { Spacing } from 'components/Layout';
import FeeLabelToggle from 'components/FeeLabelToggle';
import ProfileImage from 'components/ProfileImage';

// utils
import { findEnsNameCaseInsensitive } from 'utils/common';
import { getThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';
import { isEnoughBalanceForTransactionFee } from 'utils/assets';

// selectors
import { accountEthereumWalletAssetsBalancesSelector } from 'selectors/balances';

// types
import type { TransactionFeeInfo } from 'models/Transaction';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { Theme } from 'models/Theme';
import type { RootReducerState } from 'reducers/rootReducer';
import type { WalletAssetsBalances } from 'models/Balances';


type StateProps = {|
  ensRegistry: EnsRegistry,
  feeInfo: ?TransactionFeeInfo,
  isEstimating: boolean,
  estimateErrorMessage: ?string,
  balances: WalletAssetsBalances,
|};

type OwnProps = {|
  onCancel: () => void,
  recipient: string,
  transactionPayload: Object,
|};

type Props = {|
  ...StateProps,
  ...OwnProps,
  theme: Theme,
|};

const ContentWrapper = styled(SafeAreaView)`
  width: 100%;
  padding-bottom: 40px;
  align-items: center;
`;

const sablierLogo = require('assets/icons/sablier.png');

const SablierCancellationModal = ({
  theme,
  onCancel,
  ensRegistry,
  recipient,
  feeInfo,
  estimateErrorMessage,
  balances,
  transactionPayload,
  isEstimating,
}: Props) => {
  const colors = getThemeColors(theme);

  const username = findEnsNameCaseInsensitive(ensRegistry, recipient) || recipient;

  let notEnoughForFee;
  if (feeInfo) {
    const balanceCheckTransaction = {
      ...transactionPayload,
      txFeeInWei: feeInfo.fee,
      gasToken: feeInfo.gasToken,
    };
    notEnoughForFee = !isEnoughBalanceForTransactionFee(balances, balanceCheckTransaction, CHAIN.ETHEREUM);
  }

  const errorMessage = notEnoughForFee
    ? t('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH })
    : estimateErrorMessage;

  const modalRef = useRef();

  const isDisabled = !feeInfo || !!errorMessage || isEstimating;

  return (
    <SlideModal
      ref={modalRef}
      noClose
      headerProps={({
        centerItems: [
          { icon: 'warning', color: colors.negative, fontSize: 16 },
          { title: t('sablierContent.title.cancelStreamScreen') }],
          sideFlex: 0,
      })}
    >
      <ContentWrapper forceInset={{ top: 'never', bottom: 'always' }}>
        <Spacing h={10} />
        <ProfileImage
          userName={username}
          diameter={64}
          cornerIcon={sablierLogo}
        />
        <Spacing h={32} />
        <BaseText medium>
          {t('sablierContent.paragraph.cancelStreamWarning')}
        </BaseText>
        <Spacing h={32} />
        {(isEstimating || !!feeInfo) && (
          <FeeLabelToggle
            labelText={t('label.fee')}
            txFeeInWei={feeInfo?.fee}
            isLoading={isEstimating}
            gasToken={feeInfo?.gasToken}
            hasError={!!errorMessage}
          />
        )}
        {!!errorMessage && (
          <BaseText negative style={{ marginTop: spacing.medium }}>
            {errorMessage}
          </BaseText>
        )}
        <Spacing h={16} />
        <Button
          secondary
          title={t('sablierContent.button.confirmStreamCancellation')}
          onPress={() => {
            if (modalRef.current) modalRef.current.close();
            onCancel();
          }}
          disabled={isDisabled}
        />
        <Spacing h={4} />
        <Button
          transparent
          title={t('sablierContent.button.cancelStreamCancellation')}
          onPress={() => {
            if (modalRef.current) modalRef.current.close();
          }}
        />
      </ContentWrapper>
    </SlideModal>
  );
};

const mapStateToProps = ({
  ensRegistry: { data: ensRegistry },
  transactionEstimate: { feeInfo, isEstimating, errorMessage: estimateErrorMessage },
}: RootReducerState): $Shape<StateProps> => ({
  ensRegistry,
  feeInfo,
  isEstimating,
  estimateErrorMessage,
});

const structuredSelector = createStructuredSelector({
  balances: accountEthereumWalletAssetsBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default (withTheme(connect(combinedMapStateToProps)(SablierCancellationModal)): AbstractComponent<OwnProps>);
