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

import React, { useState } from 'react';
import { storiesOf } from '@storybook/react-native';
import styled from 'styled-components/native';

import { BaseText } from 'components/legacy/Typography';
import Button from 'components/legacy/Button';

import FloatingBox from './FloatingBox';
import WithThemeDecorator from '../../../storybook/WithThemeDecorator';

const stories = storiesOf('FloatingBox', module).addDecorator(WithThemeDecorator);

const BoxText = styled(BaseText)`
  color: white;
`;

stories.add('default', () => (
  <FloatingBox>
    <BoxText>Floating box content</BoxText>
  </FloatingBox>
));

const InteractiveWrapper = styled.View`
  flex: 1;
  justify-content: center;
  padding: 20px;
`;

const Interactive = () => {
  const [isVisible, setVisible] = useState(false);

  return (
    <InteractiveWrapper>
      <Button onPress={() => setVisible(!isVisible)} title={isVisible ? 'hide' : 'show'} />
      <FloatingBox isVisible={isVisible}>
        <BoxText>Floating box content</BoxText>
      </FloatingBox>
    </InteractiveWrapper>
  );
};

stories.add('interactive', () => <Interactive />);
