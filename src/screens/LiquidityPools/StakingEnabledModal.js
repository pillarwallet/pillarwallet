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
import styled from 'styled-components/native';
import t from 'translations/translate';

import { BaseText, MediumText } from 'components/legacy/Typography';
import Button from 'components/legacy/Button';
import Image from 'components/Image';
import ModalBox from 'components/ModalBox';
import { Spacing } from 'components/legacy/Layout';

import type { LiquidityPool } from 'models/LiquidityPools';


type Props = {
  pool: LiquidityPool,
  stakeTokens: () => void,
};

const Wrapper = styled.View`
  padding: 24px 20px 32px;
`;

const PoolIcon = styled(Image)`
  width: 76px;
  height: 76px;
`;

const StakingEnabledModal = ({ pool, stakeTokens }: Props) => {
  const modalRef = useRef();
  return (
    <ModalBox
      ref={modalRef}
    >
      <Wrapper>
        <MediumText big center>{t('liquidityPoolsContent.modal.stakingEnabled.liquidityAdded')}</MediumText>
        <Spacing h={16} />
        <PoolIcon source={{ uri: pool.iconUrl }} />
        <Spacing h={16} />
        <MediumText large center>{t('liquidityPoolsContent.modal.stakingEnabled.stakingUnlocked')}</MediumText>
        <Spacing h={8} />
        <BaseText regular secondary center>{t('liquidityPoolsContent.modal.stakingEnabled.stakeYourTokens')}</BaseText>
        <Spacing h={24} />
        <Button
          title={t('liquidityPoolsContent.modal.stakingEnabled.stakeTokensButton')}
          onPress={stakeTokens}
        />
        <Spacing h={8} />
        <Button
          transparent
          title={t('liquidityPoolsContent.modal.stakingEnabled.laterButton')}
          onPress={() => modalRef.current && modalRef.current.close()}
        />
      </Wrapper>
    </ModalBox>
  );
};

export default StakingEnabledModal;
