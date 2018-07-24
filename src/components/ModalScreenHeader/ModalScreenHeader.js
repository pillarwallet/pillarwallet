// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { UIColors, baseColors } from 'utils/variables';
import { TouchableWithoutFeedback, View, Platform } from 'react-native';
import { Label, SubTitle } from 'components/Typography';
import ButtonIcon from 'components/ButtonIcon';
import Title from 'components/Title';
import { noop } from 'utils/common';


type Props = {
  onBack?: Function,
  onClose: Function,
  subtitle?: boolean,
  title?: string,
  rightLabelText?: string,
}

const Header = styled.View`
  background-color: #fff;
  height: 97px;
  padding: 0 16px;
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
  margin-top: ${Platform.OS === 'ios' ? 0 : 5};
  margin-right: ${Platform.OS === 'ios' ? -2 : -8};
`;

const BackIcon = styled(ButtonIcon)`
  margin: 0 0 0 -10px;
  padding: 14px 0 0;
`;

const CloseButton = styled(ButtonIcon)`
  margin: -2px 2px 0 10px;
  align-items: center;
  justify-content: center;
  align-self: flex-end;
`;

const ModalSubTitle = styled(SubTitle)`
  margin: 20px 0;
`;

const ModalScreenHeader = (props: Props) => {
  const {
    onBack,
    onClose,
    title,
    subtitle,
    rightLabelText = '',
  } = props;


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
    <Header>
      <View>
        <TouchableWithoutFeedback onPress={() => onBack ? onBack(null) : noop}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
            {onBack &&
            <BackIcon
              icon="chevron-left"
              type="Feather"
              onPress={() => onBack(null)}
              color={UIColors.primary}
              style={additionalStyle}
            />
            }
            {!!subtitle &&
              <ModalSubTitle>{title}</ModalSubTitle>
            }
            {!subtitle &&
              <Title title={title} />
            }
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
