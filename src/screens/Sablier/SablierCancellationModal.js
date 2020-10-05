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
import SlideModal from 'components/Modals/SlideModal';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import { Spacing } from 'components/Layout';
import FeeLabelToggle from 'components/FeeLabelToggle';
import ProfileImage from 'components/ProfileImage';
import { findEnsNameCaseInsensitive } from 'utils/common';
import { getThemeColors } from 'utils/themes';

import type { GasToken } from 'models/Transaction';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { Theme } from 'models/Theme';
import type { RootReducerState } from 'reducers/rootReducer';

type CancelData = {
  txFeeInWei: number,
  gasToken: GasToken,
  isDisabled?: boolean,
  recipient: string,
};

type StateProps = {|
  ensRegistry: EnsRegistry,
|};

type OwnProps = {|
  onCancel: () => void,
  cancelData: CancelData,
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
  theme, onCancel, cancelData, ensRegistry,
}: Props) => {
  const colors = getThemeColors(theme);

  const {
    txFeeInWei, gasToken, isDisabled, recipient,
  } = cancelData;

  const username = findEnsNameCaseInsensitive(ensRegistry, recipient) || recipient;

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
        <FeeLabelToggle
          labelText={t('label.fee')}
          txFeeInWei={txFeeInWei}
          gasToken={gasToken}
          showFiatDefault
        />
        <Spacing h={16} />
        <Button
          secondary
          block
          title={t('sablierContent.button.confirmStreamCancellation')}
          onPress={() => {
            if (modalRef.current) modalRef.current.close();
            onCancel();
          }}
          disabled={isDisabled}
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
}: RootReducerState): StateProps => ({
  ensRegistry,
});

export default (withTheme(connect(mapStateToProps)(SablierCancellationModal)): AbstractComponent<OwnProps>);
