// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { UIColors, baseColors } from 'utils/variables';
import { TouchableWithoutFeedback, View } from 'react-native';
import ButtonIcon from 'components/ButtonIcon';
import Title from 'components/Title';
import { noop } from 'utils/common';

const Header = styled.View`
  flex-direction: row;
  height: 97px;
  background-color: ${baseColors.white};
  padding: 0 16px;
  align-items: center;
  justify-content: space-between;
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

  return (
    <Header>
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
