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
import t from 'translations/translate';

import { MediumText, BaseText } from 'components/Typography';
import Modal from 'components/Modal';
import TextInput from 'components/TextInput/TextInput';

import { themedColors } from 'utils/themes';
import { spacing, fontStyles, baseColors } from 'utils/variables';

import type { Theme } from 'models/Theme';
import { DARK_THEME } from 'constants/appSettingsConstants';
import WBTCCustomSlippageModal from './WBTCCustomSlippageModal';

const Container = styled.View`
  padding: ${spacing.rhythm}px;
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${({ theme }) => theme.colors.basic050};
`;

const Row = styled.View`
  flex-direction: row;
  margin-bottom: 8px;
  align-items: center;
`;

const Title = styled(MediumText)`
  ${fontStyles.regular};
`;

const Text = styled(BaseText)`
  ${fontStyles.regular};
  color: ${themedColors.secondaryText};
  margin-bottom: 15px;
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
  border-radius: 4px;
  background-color: ${({ isActive, theme }) => isActive ? theme.colors.basic080 : theme.colors.basic050};
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
  border-color: ${({ isDarkTheme }) => isDarkTheme ? baseColors.darkBlue : themedColors.inactiveTabBarIcon};
  background-color: ${({ isDarkTheme }) => isDarkTheme ? baseColors.darkBlue : baseColors.white};
`;

const InnerCircle = styled.View`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: ${({ theme }) => theme.colors.primaryAccent130};
`;

const Label = styled.View`
  position: absolute;
  right: 50;
  justify-content: center;
  bottom: 0;
`;

// 0 is for custom
const PRESET_VALUES = [0.5, 1, 3, 0];

type Props = {
  theme: Theme,
  onModalWillHide: (val: number) => void,
}

const img = require('assets/icons/change.png');

const SlippageModal = ({ theme, onModalWillHide }: Props) => {
  const [activeValue, setActiveValue] = React.useState<number>(0.5);
  const [customValue, setCustomValue] = React.useState<number | null>(null);

  const isActiveOption = (val: number) => val === activeValue || (!val && !PRESET_VALUES.includes(activeValue));

  const handleCustomSubmit = (val: number) => {
    setActiveValue(val);
    setCustomValue(val);
  };

  const handleOptionPress = (val: ?number) => {
    if (val) {
      setActiveValue(val);
      setCustomValue(null);
      return null;
    }
    return Modal.open(() => <WBTCCustomSlippageModal onSubmit={handleCustomSubmit} activeValue={activeValue} />);
  };

  const isCustomSet = () => customValue || customValue === 0;

  const getCustomOptionLabelComponent = () => {
    if (isCustomSet()) return <OptionText>{`${customValue || ''}%`}</OptionText>;
    return (<TextInput
      customInputHeight={38}
      rightPlaceholder="%"
      inputProps={{ editable: false, onTouchStart: () => handleOptionPress(customValue) }}
    />);
  };

  const getRow = (val: number) => {
    const isActive = isActiveOption(val);
    return (
      <Option onPress={() => handleOptionPress(val)} key={val} isActive={isActive}>
        <OptionText>{val ? `${val}%` : t('wbtcCafe.custom')}</OptionText>
        {!val && <Label style={[isCustomSet() && { bottom: null }]}>{getCustomOptionLabelComponent()}</Label>}
        <Circle isDarkTheme={theme.current === DARK_THEME} >
          {isActiveOption(val) && <InnerCircle />}
        </Circle>
      </Option>
    );
  };

  return (
    <Modal onModalWillHide={() => onModalWillHide(activeValue)}>
      <Container>
        <Row>
          <ExchangeIcon source={img} />
          <Title>{t('exchangeContent.label.maxSlippage')}</Title>
        </Row>
        <Text>{t('wbtcCafe.slippageDesc')}</Text>
        {PRESET_VALUES.map(val => getRow(val))}
      </Container>
    </Modal>
  );
};

export default withTheme(SlippageModal);
