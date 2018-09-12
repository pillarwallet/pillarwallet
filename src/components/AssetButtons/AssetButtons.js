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
  flex: 1;
  justify-content: center;
  margin: 20px 0;
  padding: 10px;
`;


const AssetButtons = (props: Props) => {
  return (
    <AssetButtonsWrapper>
      <CircleButton disabled={props.isReceiveDisabled} label="Receive" icon="qrcode" onPress={props.onPressReceive} />
      <CircleButton
        disabled={props.noBalance || props.isSendDisabled}
        label="Send"
        icon="send-asset"
        onPress={props.onPressSend}
      />
    </AssetButtonsWrapper>
  );
};

export default AssetButtons;

