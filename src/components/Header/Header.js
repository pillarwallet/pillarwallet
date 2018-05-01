// @flow
import * as React from 'react';
import { Header as NBHeader, Left } from 'native-base';
import styled from 'styled-components/native';
import ButtonIcon from 'components/ButtonIcon';

type Props = {
  onBack: Function,
  index?: number,
}

const Wrapper = styled(NBHeader)`
  background-color: #fff;
  border-bottom-width: 0;
`;

const BackIcon = styled(ButtonIcon)`
  position: relative;
  top: 10px;
`;

const Header = (props: Props) => {
  const { onBack, index } = props;

  if (!index) return null;

  return (
    <Wrapper>
      <Left>
        <BackIcon icon="arrow-back" color="#000" onPress={() => onBack(null)} fontSize={28} />
      </Left>
    </Wrapper>
  );
};

export default Header;
