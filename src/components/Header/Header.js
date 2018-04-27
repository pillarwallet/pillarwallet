// @flow
import * as React from 'react';
import { Container, Header as NBHeader, Left, Button, Icon } from 'native-base';
import styled from 'styled-components/native';
import ButtonIcon from 'components/ButtonIcon'

type Props = {
  onBack: Function
}

const Wrapper = styled(NBHeader)`
  background-color: #fff;
  border-bottom-width: 0;
`;

const BackIcon = styled(ButtonIcon)`
  position: relative;
  top: 10px;
`;

export default function Header(props: Props) {
  const { onBack } = props;
  return (
    <Wrapper>
      <Left>
        <BackIcon icon="arrow-back" color="#000" onPress={onBack} fontSize={28} />
      </Left>
    </Wrapper>
  );
}
