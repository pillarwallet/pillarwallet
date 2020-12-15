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
import { MediumText } from 'components/Typography';
import { spacing, fontStyles } from 'utils/variables';
import t from 'translations/translate';
import { themedColors } from 'utils/themes';
import Modal from 'components/Modal';
import type { Theme } from 'models/Theme';
import TextInput from 'components/TextInput/TextInput';
import Button from 'components/Button';

const Container = styled.View`
  border-radius: 10px;
  padding: ${spacing.rhythm}px;
  position: absolute;
  top: 150;
  width: 100%;
  background-color: ${themedColors.card};
`;

const CustomTitle = styled(MediumText)`
  ${fontStyles.regular};
  margin-bottom: 20px;
`;

type Props = {
  theme: Theme,
  onSubmit: (val: number) => void,
  activeValue: number,
}

const SlippageModal = ({ onSubmit, activeValue }: Props) => {
  const [customValue, setCustomValue] = React.useState<string>(String(activeValue));
  const modalRef = React.createRef<Modal>();

  const convertToNumber = (input: string) => +(input.replace(/,/g, '.'));

  const isValidCustomValue = () => {
    const converted = convertToNumber(customValue);
    return (!!converted || converted === 0) && converted <= 100;
  };

  const handleCustomChange = (input: string) => {
    if (!input) input = '0';
    input = input.replace(/,/g, '.');
    // 01 => 1, 00 => 0
    if (input[1] && input[0] === '0' && !['.', ','].includes(input[1])) input = input.substring(1);
    setCustomValue(input);
  };

  const inputProps = {
    onChange: handleCustomChange,
    value: customValue,
  };

  const handlePress = () => {
    onSubmit(+customValue);
    if (modalRef.current) modalRef.current.close();
  };

  return (
    <Modal ref={modalRef}>
      <Container>
        <CustomTitle>{t('wbtcCafe.enterCustom')}</CustomTitle>
        <TextInput
          inputProps={inputProps}
          numeric
          hasError={!isValidCustomValue()}
          errorMessage={t('error.amount.invalidNumber')}
        />
        <Button
          marginTop={spacing.rhythm}
          disabled={!isValidCustomValue()}
          onPress={handlePress}
          title={t('button.apply')}
          style={{ zIndex: -1 }}
        />
      </Container>
    </Modal>
  );
};

export default withTheme(SlippageModal);
