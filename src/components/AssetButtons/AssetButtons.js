// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors } from 'utils/variables';

type Props = {
  onPressReceive: Function,
  onPressSend: Function,
}

const imageSend = require('../../assets/images/btn_iconSend.png');
const imageReceive = require('../../assets/images/btn_iconReceive.png');

const AssetButtonsWrapper = styled.View`
  flex-direction: row;
  flex: 1;
  justify-content: center;
  margin: 20px 0;
`;

const AssetButton = styled.TouchableOpacity`
  margin: 0 20px;
  width: 48px;
  height: 48px;
  background: ${baseColors.snowWhite};
  border-radius: 2px;
  justify-content: center;
  align-items: center;
`;

const AssetButtonImage = styled.Image`
  width: 48px;
  height: 48px;
`;

const AssetButtonText = styled.Text`
  color: ${baseColors.electricBlue};
  text-align: center;
  margin-top: 10px;
`;

const AssetButtons = (props: Props) => {
  return (
    <AssetButtonsWrapper>
      <AssetButton onPress={props.onPressSend}>
        <AssetButtonImage source={imageSend} />
        <AssetButtonText>Send</AssetButtonText>
      </AssetButton>
      <AssetButton onPress={props.onPressReceive}>
        <AssetButtonImage source={imageReceive} />
        <AssetButtonText>Receive</AssetButtonText>
      </AssetButton>
    </AssetButtonsWrapper>
  );
};

export default AssetButtons;

