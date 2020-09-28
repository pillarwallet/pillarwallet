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

import React, { useState, useRef } from 'react';
import styled from 'styled-components/native';
import t from 'translations/translate';

import SlideModal from 'components/Modals/SlideModal';
import TitleWithIcon from 'components/Title/TitleWithIcon';
import SelectorList from 'components/SelectorList';

import type { Option } from 'components/SelectorList';

type Props = {|
  speedOptions: null | Option[],
  initialSpeed: string,
  onSpeedChange: (txSpeed: string) => void,
|};

const SliderContentWrapper = styled.View`
  margin: 30px 0;
`;

const ExchangeSpeedModal = ({
  speedOptions,
  initialSpeed,
  onSpeedChange,
}: Props) => {
  const [transactionSpeed, setTransactionSpeed] = useState(initialSpeed);
  const modalRef = useRef();

  const handleSpeedChange = (value: string | number) => {
    const txSpeed = value.toString();
    setTransactionSpeed(txSpeed);
    onSpeedChange(txSpeed);
    if (modalRef.current) modalRef.current.close();
  };

  return (
    <SlideModal
      ref={modalRef}
      hideHeader
    >
      <SliderContentWrapper>
        <TitleWithIcon iconName="lightning" title={t('transactions.label.speed')} />
        {speedOptions && (
        <SelectorList
          onSelect={handleSpeedChange}
          options={speedOptions}
          selectedValue={transactionSpeed}
          numColumns={3}
          minItemWidth={90}
        />
        ) }
      </SliderContentWrapper>
    </SlideModal>
  );
};

export default ExchangeSpeedModal;
