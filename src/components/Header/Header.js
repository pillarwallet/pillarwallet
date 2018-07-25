// @flow
import * as React from 'react';
import { Platform } from 'react-native';
import { Left, Body, Right, Icon } from 'native-base';
import { TextLink, BaseText } from 'components/Typography';
import { UIColors, baseColors, fontSizes } from 'utils/variables';
import Title from 'components/Title';
import styled from 'styled-components/native';
import ButtonIcon from 'components/ButtonIcon';

type Props = {
  onBack?: Function,
  onClose?: Function,
  onCloseText?: string,
  onNextPress?: Function,
  nextText?: string,
  title?: string,
  gray?: boolean,
  centerTitle?: boolean,
}

const Wrapper = styled.View`
  background-color: ${props => props.gray ? baseColors.snowWhite : baseColors.white};
  border-bottom-width: 0;
  padding: 0 16px;
  height: 40px;
  justify-content: flex-end;
  align-items: flex-end;
  flex-direction: row;
  margin-bottom: 20px;
  margin-top: ${Platform.OS === 'android' ? '20px' : '0'};
`;

const BackIcon = styled(ButtonIcon)`
  position: relative;
  align-self: flex-start;
`;

const CloseIconText = styled(BaseText)`
  margin-right: 10px;
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.extraExtraSmall};
`;

const CloseIconWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
`;

const CloseIcon = styled(Icon)`
  height: 36px;
`;

const HeaderLeft = styled(Left)`
  flex: ${props => props.showTitleLeft ? 2 : 1};
  justify-content: flex-start;
  align-items: flex-end;
`;


const HeaderRight = styled(Right)`
  flex: 1;
  justify-content: flex-end;
  align-items: flex-end;
`;

const Header = (props: Props) => {
  const {
    onBack,
    nextText,
    onNextPress,
    onClose,
    onCloseText,
    title,
    centerTitle,
    gray,
  } = props;
  const showRight = nextText || onBack || onClose;
  const titleOnBack = title && onBack;
  const showTitleCenter = titleOnBack || centerTitle;
  const showTitleLeft = !onBack && !centerTitle;
  return (
    <Wrapper gray={gray}>
      <HeaderLeft showTitleLeft={showTitleLeft}>
        {onBack &&
          <BackIcon icon="arrow-back" color={UIColors.primary} onPress={() => onBack(null)} fontSize={28} />
        }
        {showTitleLeft &&
          <Title noMargin title={title} />
        }
      </HeaderLeft>
      {showTitleCenter &&
        <Body style={{ flex: 1 }}>
          <Title align="center" noMargin title={title} />
        </Body>
      }
      {showRight &&
        <HeaderRight onClose={onClose}>
          {nextText &&
            <TextLink onPress={onNextPress}>{nextText}</TextLink>
          }
          {onClose &&
            <CloseIconWrapper>
              {onCloseText &&
                <CloseIconText>{onCloseText}</CloseIconText>
              }
              <CloseIcon name="ios-close" style={{ fontSize: 36, color: UIColors.primary }} onPress={onClose} />
            </CloseIconWrapper>
          }
        </HeaderRight>
      }
    </Wrapper>
  );
};

export default Header;
