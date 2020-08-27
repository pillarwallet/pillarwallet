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
import { CachedImage } from 'react-native-cached-image';
import { SafeAreaView } from 'react-navigation';
import styled from 'styled-components/native';
import t from 'translations/translate';

import SlideModal from 'components/Modals/SlideModal';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import { Spacing } from 'components/Layout';
import FeeLabelToggle from 'components/FeeLabelToggle';
import type { GasToken } from 'models/Transaction';


export type AllowData = {
  assetSymbol: ?string,
  txFeeInWei: number,
  gasToken: ?GasToken,
  isDisabled?: boolean,
  assetIcon: string,
};

type Props = {
  isVisible: boolean,
  onModalHide: () => void,
  onAllow: () => void,
  allowData: AllowData,
};

const Logo = styled(CachedImage)`
  width: 64px;
  height: 64px;
`;

const IconsWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
`;

const ContentWrapper = styled(SafeAreaView)`
  width: 100%;
  padding-bottom: 40px;
  align-items: center;
`;

const sablierLogo = require('assets/icons/sablier.png');

const SablierAllowanceModal = ({
  isVisible, onModalHide, onAllow, allowData,
}: Props) => {
  const {
    assetSymbol, txFeeInWei, gasToken, isDisabled, assetIcon,
  } = allowData;

  return (
    <SlideModal
      isVisible={isVisible}
      onModalHide={onModalHide}
      noClose
      headerProps={{
        centerItems: [{ title: t('sablierContent.title.allowanceModal') }],
        sideFlex: '0',
      }}
    >
      <ContentWrapper forceInset={{ top: 'never', bottom: 'always' }}>
        <IconsWrapper>
          <Logo
            source={{ uri: assetIcon }}
            style={{ marginRight: -7, zIndex: 1 }}
          />
          <Logo
            source={sablierLogo}
            style={{ marginLeft: -7, zIndex: 0 }}
          />
        </IconsWrapper>
        <Spacing h={20} />
        <BaseText medium center>
          {t('sablierContent.paragraph.allowSablierWithToken', { token: assetSymbol })}
        </BaseText>
        <Spacing h={36} />
        <Button title={t('button.allow')} block onPress={onAllow} disabled={isDisabled} />
        <Spacing h={16} />
        <FeeLabelToggle
          labelText={t('label.fee')}
          txFeeInWei={txFeeInWei}
          gasToken={gasToken}
          showFiatDefault
        />
      </ContentWrapper>
    </SlideModal>
  );
};

export default SablierAllowanceModal;
