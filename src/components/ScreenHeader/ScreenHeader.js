// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { UIColors } from 'utils/variables';
import { TouchableWithoutFeedback, View, Platform } from 'react-native';
import ButtonIcon from 'components/ButtonIcon';
import Title from 'components/Title';
import { noop } from 'utils/common';

type Props = {
  onBack?: Function,
  title?: string,
}

const Header = styled.View`
  background-color: #fff;
  padding: 40px 16px 0;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const Left = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const BackIcon = styled(ButtonIcon)`
  position: relative;
  top: 10px;
`;

const ScreenHeader = (props: Props) => {
  const {
    onBack,
    title,
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
                fontSize={32}
              />
            }
            <Title title={title} />
          </View>
        </TouchableWithoutFeedback>
      </Left>
    </Header>
  );
};

export default ScreenHeader;
