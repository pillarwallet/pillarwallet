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
`;

const BackIcon = styled(ButtonIcon)`
  position: relative;
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
      <Left>
        {onBack &&
          <BackIcon icon="arrow-back" color="#000" onPress={() => onBack(null)} fontSize={28} />
        }
      </Left>
      <Body>
        {title &&
          <Title center noMargin title={title} />
        }
      </Body>
      <Right>
        {nextText && (
          <TextLink onPress={onNextPress}>
            {nextText}
          </TextLink>
        )}
      </Right>

    </Wrapper>
  );
};

export default Header;
