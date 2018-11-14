// @flow
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

