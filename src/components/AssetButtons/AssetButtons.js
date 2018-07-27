// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { baseColors, fontSizes } from 'utils/variables';
import { BoldText } from 'components/Typography';

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
  padding: 10px;
`;

const AssetButton = styled.TouchableOpacity`
  justify-content: center;
  align-items: center;
  margin: 0 14px;
  padding: 6px;
`;

const ImageHolder = styled.View`
  border-radius: 50;
  width: 54px;
  height: 54px;
  background: ${baseColors.white};
  justify-content: center;
  display: flex;
  flex-direction: row;
  align-items: center;
  box-shadow: .5px 1px 1px ${baseColors.mediumGray};
  elevation: 6;
`;

const AssetButtonImage = styled.Image`
  width: 27px;
  height: 27px;
  justify-content: center;
  display: flex;
`;

const AssetButtonText = styled(BoldText)`
  color: ${baseColors.electricBlue};
  text-align: center;
  font-size: ${fontSizes.extraSmall};
  margin-top: 10px;
`;

const AssetButtons = (props: Props) => {
  return (
    <AssetButtonsWrapper>
      <AssetButton onPress={props.onPressReceive}>
        <ImageHolder>
          <AssetButtonImage source={imageReceive} />
        </ImageHolder>
        <AssetButtonText>RECEIVE</AssetButtonText>
      </AssetButton>
      <AssetButton onPress={props.onPressSend}>
        <ImageHolder>
          <AssetButtonImage source={imageSend} />
        </ImageHolder>
        <AssetButtonText>SEND</AssetButtonText>
      </AssetButton>
    </AssetButtonsWrapper>
  );
};

export default AssetButtons;

