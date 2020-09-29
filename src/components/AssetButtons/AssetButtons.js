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
import t from 'translations/translate';

import CircleButton from 'components/CircleButton';


type Props = {
  onPressReceive: Function,
  onPressSend: Function,
  onPressExchange?: ?Function,
  noBalance?: boolean,
  isSendDisabled?: boolean,
  isReceiveDisabled?: boolean,
  showButtons?: string[],
};

const AssetButtonsWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  padding: 0 10px;
  margin: 0;
`;

const AssetButtons = (props: Props) => {
  // eslint-disable-next-line i18next/no-literal-string
  const showButtons = props.showButtons || ['send', 'receive', 'exchange'];
  const showSend = showButtons.includes('send');
  const showReceive = showButtons.includes('receive');
  const showExchange = showButtons.includes('exchange');
  return (
    <AssetButtonsWrapper>
      {showReceive &&
      <CircleButton
        disabled={props.isReceiveDisabled}
        label={t('button.addFunds')}
        fontIcon="qrDetailed"
        onPress={props.onPressReceive}
      />
      }
      {showSend &&
      <CircleButton
        disabled={props.noBalance || props.isSendDisabled}
        label={t('button.send')}
        fontIcon="paperPlane"
        onPress={props.onPressSend}
      />
      }
      {!!props.onPressExchange && showExchange &&
      <CircleButton
        disabled={props.noBalance || props.isSendDisabled}
        label={t('button.exchange')}
        fontIcon="exchange"
        onPress={props.onPressExchange}
      />}
    </AssetButtonsWrapper>
  );
};

export default AssetButtons;

