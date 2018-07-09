// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { UIColors, baseColors } from 'utils/variables';
import { TouchableWithoutFeedback, View, Platform } from 'react-native';
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

const Header = styled.View`
  background-color: #fff;
  height: 80px;
  padding: 0 16px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const Left = styled.View`
  display: flex;
  flex-direction: row;
`;


const Right = styled.View`
  display: flex;
  flex-direction: row;
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
            <Title title={title} />
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
