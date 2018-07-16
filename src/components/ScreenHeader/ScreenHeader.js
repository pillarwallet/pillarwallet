// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { UIColors } from 'utils/variables';
import { TouchableWithoutFeedback, View, Platform } from 'react-native';
import ButtonIcon from 'components/ButtonIcon';
import Title from 'components/Title';
import { noop } from 'utils/common';

const Header = styled.View`
  background-color: #fff;
  padding: 0 16px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-top: ${Platform.OS === 'ios' ? '44px' : 0};
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

type Props = {
  onBack?: Function,
  title?: string,
};

const ScreenHeader = (props: Props) => {
  const { onBack, title } = props;
  const onBackLeftPadding = Platform.OS === 'ios' ? 5 : 0;

  return (
    <Header style={{ paddingLeft: onBack ? onBackLeftPadding : 16 }}>
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
