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
  padding: 0 14px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const Right = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  margin-top: ${Platform.OS === 'ios' ? 0 : 5}
  margin-right: ${Platform.OS === 'ios' ? -13 : -8}
`;

const BackIcon = styled(ButtonIcon)`
  position: relative;
  top: 10px;
  margin: 0 -10px;
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

  const onBackLeftPadding = Platform.OS === 'ios' ? 2 : 0;

  const additionalStyle = Platform.OS === 'ios' ?
    {
      marginBottom: 10,
    }
    :
    {
      marginBottom: 15,
      paddingLeft: 15,
    };

  return (
    <Header style={{ paddingLeft: onBack ? onBackLeftPadding : 16 }}>
      <View>
        <TouchableWithoutFeedback onPress={() => onBack ? onBack(null) : noop}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
            {onBack &&
            <BackIcon
              icon="chevron-left"
              type="Feather"
              onPress={() => onBack(null)}
              color={UIColors.primary}
              fontSize={32}
              style={additionalStyle}
            />
            }
            <Title title={title} />
          </View>
        </TouchableWithoutFeedback>
      </View>
      <Right>
        <Label style={{ lineHeight: 20 }}>{rightLabelText.toUpperCase()}</Label>
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
