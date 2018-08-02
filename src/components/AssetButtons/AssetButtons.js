// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import Icon from 'components/Icon';
import { baseColors, fontSizes } from 'utils/variables';
import { BoldText } from 'components/Typography';

type Props = {
  onPressReceive: Function,
  onPressSend: Function,
  noBalance?: boolean,
}

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

const AssetButtonIconWrapper = styled.View`
  border-radius: 50;
  width: 54px;
  height: 54px;
  background: ${props => props.disabled ? baseColors.lightGray : baseColors.white};
  justify-content: center;
  display: flex;
  flex-direction: row;
  align-items: center;
  box-shadow: .5px 1px 1px ${baseColors.mediumGray};
  elevation: ${props => props.disabled ? 0 : 6};
`;

const AssetButtonIcon = styled(Icon)`
  font-size: ${fontSizes.extraExtraLarge};
  color: ${props => props.disabled ? baseColors.mediumGray : baseColors.clearBlue};
  justify-content: center;
  display: flex;
`;

const AssetButtonText = styled(BoldText)`
  color: ${props => props.disabled ? baseColors.mediumGray : baseColors.electricBlue};
  text-align: center;
  font-size: ${fontSizes.extraSmall};
  margin-top: 10px;
`;

const AssetButtons = (props: Props) => {
  return (
    <AssetButtonsWrapper>
      <AssetButton onPress={props.onPressReceive}>
        <AssetButtonIconWrapper>
          <AssetButtonIcon name="qrcode" />
        </AssetButtonIconWrapper>
        <AssetButtonText>RECEIVE</AssetButtonText>
      </AssetButton>
      <AssetButton disabled={props.noBalance} onPress={props.noBalance ? null : props.onPressSend}>
        <AssetButtonIconWrapper disabled={props.noBalance}>
          <AssetButtonIcon disabled={props.noBalance} name="send" />
        </AssetButtonIconWrapper>
        <AssetButtonText disabled={props.noBalance}>SEND</AssetButtonText>
      </AssetButton>
    </AssetButtonsWrapper>
  );
};

export default AssetButtons;

