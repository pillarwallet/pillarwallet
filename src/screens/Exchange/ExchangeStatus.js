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
import styled from 'styled-components/native';
import Animation from 'components/Animation';
import { baseColors, fontStyles } from 'utils/variables';
import { BoldText } from 'components/Typography';

const Status = styled.View`
  flex-direction: row;
  height: 50px;
  justify-content: flex-start;
  align-items: center;
`;

const StatusIcon = styled.View`
  height: 8px;
  width: 8px;
  border-radius: 4px;
  background-color: ${baseColors.positive};
  position: absolute;
  top: 7px;
  left: 7px;
`;

const StatusText = styled(BoldText)`
  ${fontStyles.tiny};
  color: ${baseColors.positive};
  letter-spacing: 0.15px;
  margin-top: 2px;
`;

const IconHolder = styled.View`
  position: relative;
`;

const animationSource = require('assets/animations/livePulsatingAnimation.json');

export const ExchangeStatus = () => {
  return (
    <Status>
      <IconHolder>
        <Animation source={animationSource} style={{ height: 22, width: 22 }} loop speed={0.9} />
        <StatusIcon />
      </IconHolder>
      <StatusText>ACTIVE</StatusText>
    </Status>
  );
};
