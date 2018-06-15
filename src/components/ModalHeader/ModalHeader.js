// @flow
import * as React from 'react';
import { Header as NBHeader, Right } from 'native-base';
import { UIColors } from 'utils/variables';
import ButtonIcon from 'components/ButtonIcon';
import styled from 'styled-components/native';

type Props = {
  onClose: Function,
}

const Wrapper = styled(NBHeader)`
  background-color: #fff;
  border-bottom-width: 0;
  elevation: 0;
`;


const Header = (props: Props) => {
  const {
    onClose,
  } = props;

  return (
    <Wrapper>
      <Right>
        <ButtonIcon
          icon="md-close"
          onPress={onClose}
          color={UIColors.primary}
          fontSize={32}
        />
      </Right>
    </Wrapper>
  );
};

export default Header;
