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
import { accountBalancesSelector } from 'selectors/balances';

// types
import type { TransactionFeeInfo } from 'models/Transaction';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { Theme } from 'models/Theme';
import type { RootReducerState } from 'reducers/rootReducer';
import type { Balances } from 'models/Asset';


type StateProps = {|
  ensRegistry: EnsRegistry,
  feeInfo: ?TransactionFeeInfo,
  estimateErrorMessage: ?string,
  balances: Balances,
|};

type OwnProps = {|
  onCancel: () => void,
|};

type Props = {|
  ...StateProps,
  ...OwnProps,
  theme: Theme,
  recipient: string,
  transactionPayload: Object,
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
}: Props) => {
  const colors = getThemeColors(theme);

  const username = findEnsNameCaseInsensitive(ensRegistry, recipient) || recipient;

  let notEnoughForFee;
  if (feeInfo) {
    notEnoughForFee = !isEnoughBalanceForTransactionFee(balances, {
      ...transactionPayload,
      txFeeInWei: feeInfo.fee,
      gasToken: feeInfo.gasToken,
    });
  }

  const errorMessage = notEnoughForFee
    ? t('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || ETH })
    : estimateErrorMessage;

  const modalRef = useRef();

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
          noShadow
          borderWidth={0}
          cornerIcon={sablierLogo}
        />
        <Spacing h={32} />
        <BaseText medium>
          {t('sablierContent.paragraph.cancelStreamWarning')}
        </BaseText>
        <Spacing h={32} />
        {!!feeInfo && (
          <FeeLabelToggle
            labelText={t('label.fee')}
            txFeeInWei={feeInfo?.fee}
            gasToken={feeInfo?.gasToken}
            hasError={!!errorMessage}
            showFiatDefault
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
          block
          title={t('sablierContent.button.confirmStreamCancellation')}
          onPress={() => {
            if (modalRef.current) modalRef.current.close();
            onCancel();
          }}
          disabled={!!errorMessage}
        />
        <Spacing h={8} />
        <Button
          squarePrimary
          block
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
  transactionEstimate: { feeInfo, errorMessage: estimateErrorMessage },
}: RootReducerState): StateProps => ({
  ensRegistry,
  feeInfo,
  estimateErrorMessage,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default (withTheme(connect(combinedMapStateToProps)(SablierCancellationModal)): AbstractComponent<OwnProps>);
