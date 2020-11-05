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
import styled, { withTheme } from 'styled-components/native';
import { MediumText, BaseText } from 'components/Typography';
import { spacing, fontStyles } from 'utils/variables';
import t from 'translations/translate';
import { themedColors } from 'utils/themes';
import Modal from 'components/Modal';

const Container = styled.View`
  padding: ${spacing.rhythm}px;
  background-color: white;
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  position: absolute;
  bottom: 0;
`;

const Row = styled.View`
  flex-direction: row;
  margin-bottom: 8px;
  align-items: center;
`;

const Title = styled(MediumText)`
  ${fontStyles.regular};
  color: ${themedColors.labelTertiary};
`;

const Text = styled(BaseText)`
  ${fontStyles.regular};
  color: ${themedColors.labelTertiary};
`;

const ExchangeIcon = styled.Image`
  height: 18px;
  width: 14px;
  margin-right: 4px;
`;

const Option = styled.TouchableOpacity`
  padding: 18px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const OptionText = styled(BaseText)`
  ${fontStyles.medium};
  color: ${themedColors.text};
`;

const Circle = styled.View`
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  border-width: 1px;
  border-radius: 10px;
  border-color: ${themedColors.inactiveTabBarIcon};
`;

const InnerCircle = styled.View`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: ${themedColors.primary};
`;

interface Props {
  onValuePress: (val: number) => void;
  activeValue: number;
}

const img = require('assets/icons/change.png');

const SlippageModal = ({ onValuePress, activeValue }: Props) => {
  const handleOptionPress = (val) => {
    if (val) return onValuePress(val);
    return; // open modal
  };

  const getRow = (val?: number) => (
    <Option onPress={handleOptionPress} key={val}>
      <OptionText>{val ? `${val}%` : t('wbtcCafe.custom')}</OptionText>
      <Circle>
        {val === activeValue && <InnerCircle />}
      </Circle>
    </Option>
  );

  return (
    <Modal>
      <Container>
        <Row>
          <ExchangeIcon source={img} />
          <Title>{t('exchangeContent.label.maxSlippage')}</Title>
        </Row>
        <Text>{t('wbtcCafe.slippageDesc')}</Text>
        {[0.5, 1, 3, undefined].map(val => getRow(val))}
      </Container>
    </Modal>
  );
};

export default withTheme(SlippageModal);
