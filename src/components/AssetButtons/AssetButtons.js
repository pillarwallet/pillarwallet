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
import CircleButton from 'components/CircleButton';

type Props = {
  onPressReceive: Function,
  onPressSend: Function,
  noBalance?: boolean,
  isSendDisabled?: boolean,
  isReceiveDisabled?: boolean,
}

const AssetButtonsWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  padding: 0 10px;
  margin: 0;
`;

const iconReceive = require('assets/icons/icon_receive.png');
const iconSend = require('assets/icons/icon_send.png');

const AssetButtons = (props: Props) => {
  return (
    <AssetButtonsWrapper>
      <CircleButton
        disabled={props.isReceiveDisabled}
        label="Receive"
        icon={iconReceive}
        onPress={props.onPressReceive}
      />
      <CircleButton
        disabled={props.noBalance || props.isSendDisabled}
        label="Send"
        icon={iconSend}
        onPress={props.onPressSend}
      />
    </AssetButtonsWrapper>
  );
};

export default AssetButtons;

