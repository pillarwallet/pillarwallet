// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { UIColors, baseColors } from 'utils/variables';
import { TouchableWithoutFeedback, View, Platform } from 'react-native';
import { Header as NBHeader, Left as NBLeft, Right as NBRight } from 'native-base';
import { Label } from 'components/Typography';
import ButtonIcon from 'components/ButtonIcon';
import Title from 'components/Title';
import { noop } from 'utils/common';

type Props = {
  onBack?: Function,
  onClose: Function,
  title?: string,
  rightLabelText?: string,
}

const Header = styled(NBHeader)`
  background-color: #fff;
  border-bottom-width: 0;
  height: auto;
  display: flex;
  padding: 0 20px;
`;

const Left = styled(NBLeft)`
  display: flex;
  flex-direction: row;
  align-items: center;
`;


const Right = styled(NBRight)`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const BackIcon = styled(ButtonIcon)`
  margin-right: 5px;
`;

const CloseButton = styled(ButtonIcon)`
  position: relative;
  bottom: 3px;
`;

const ModalScreenHeader = (props: Props) => {
  const {
    onBack,
    onClose,
    title,
    rightLabelText = '',
  } = props;

  const onBackLeftPadding = Platform.OS === 'ios' ? 5 : 0;

  return (
    <Header style={{ paddingLeft: onBack ? onBackLeftPadding : 20 }}>
      <Left>
        <TouchableWithoutFeedback onPress={() => onBack ? onBack(null) : noop}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            {onBack &&
            <BackIcon
              icon="chevron-left"
              type="Feather"
              onPress={() => onBack(null)}
              color={UIColors.primary}
              fontSize={28}
            />
            }
            {title && <Title title={title} />}
          </View>
        </TouchableWithoutFeedback>
      </Left>
      <Right>
        <Label>{rightLabelText.toUpperCase()}</Label>
        <CloseButton
          icon="close"
          onPress={onClose}
          fontSize={Platform.OS === 'ios' ? 36 : 30}
          color={baseColors.darkGray}
        />
      </Right>
    </Header>
  );
};

export default ModalScreenHeader;
