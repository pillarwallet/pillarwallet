// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors } from 'utils/variables';

type Props = {
  onPressReceive: Function,
  onPressSend: Function,
}

const imageSend = require('assets/images/btn_iconSend.png');
const imageReceive = require('assets/images/qr.png');

const AssetButtonsWrapper = styled.View`
  flex-direction: row;
  flex: 1;
  justify-content: center;
  margin: 20px 0;
`;

const AssetButton = styled.TouchableOpacity`
  justify-content: center;
  align-items: center;
  margin: 0 20px;
`;

const ImageHolder = styled.View`
  border-radius: 50;
  width: 64px;
  height: 64px;
  background: ${baseColors.lightGray};
  justify-content: center;
  display: flex;
  flex-direction: row;
  align-items: center;
  box-shadow: .5px 1px 1px ${baseColors.mediumGray};
`;

const AssetButtonImage = styled.Image`
  width: 32px;
  height: 32px;
  justify-content: center;
  display: flex;
`;

const AssetButtonText = styled.Text`
  color: ${baseColors.electricBlue};
  text-align: center;
  font-weight: 600;
  margin-top: 10px;
`;

const AssetButtons = (props: Props) => {
  return (
    <AssetButtonsWrapper>
      <AssetButton onPress={props.onPressSend}>
        <ImageHolder>
          <AssetButtonImage source={imageSend} />
        </ImageHolder>
        <AssetButtonText>SEND</AssetButtonText>
      </AssetButton>
      <AssetButton onPress={props.onPressReceive}>
        <ImageHolder>
          <AssetButtonImage source={imageReceive} />
        </ImageHolder>
        <AssetButtonText>RECEIVE</AssetButtonText>
      </AssetButton>
    </AssetButtonsWrapper>
  );
};

export default AssetButtons;

