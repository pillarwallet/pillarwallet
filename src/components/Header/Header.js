// @flow
import * as React from 'react';
import { Header as NBHeader, Left, Body, Right } from 'native-base';
import { TextLink } from 'components/Typography';
import { baseColors } from 'utils/variables';
import Title from 'components/Title';
import styled from 'styled-components/native';
import ButtonIcon from 'components/ButtonIcon';

type Props = {
  onBack?: Function,
  onNextPress?: Function,
  nextText?: string,
  index?: number,
  title?: string,
  gray?: boolean,
}

const Wrapper = styled(NBHeader)`
  background-color: ${props => props.gray ? baseColors.snowWhite : baseColors.white};
  border-bottom-width: 0;
  padding: 0 16px;
`;

const BackIcon = styled(ButtonIcon)`
  position: relative;
  align-self: flex-start;
`;

const Header = (props: Props) => {
  const {
    onBack,
    index,
    nextText,
    onNextPress,
    title,
    gray,
  } = props;
  if (!index) return null;
  return (
    <Wrapper gray={gray}>
      <Left style={{ flex: 1, justifyContent: 'flex-start' }}>
        {onBack &&
          <BackIcon icon="back" color="#000" onPress={() => onBack(null)} />
        }
      </Left>
      <Body style={{ flex: 1 }}>
        {title &&
          <Title center noMargin title={title} />
        }
      </Body>
      <Right style={{ flex: 1, justifyContent: 'flex-end' }}>
        {nextText &&
          <TextLink onPress={onNextPress}>{nextText}</TextLink>
        }
      </Right>

    </Wrapper>
  );
};

export default Header;
