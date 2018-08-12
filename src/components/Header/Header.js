// @flow
import * as React from 'react';
import { Platform } from 'react-native';
import { Left, Body, Right } from 'native-base';
import { TextLink, BaseText } from 'components/Typography';
import { UIColors, baseColors, fontSizes } from 'utils/variables';
import Title from 'components/Title';
import styled from 'styled-components/native';
import ButtonIcon from 'components/ButtonIcon';
import { noop } from 'utils/common';

type Props = {
  onBack?: Function,
  onClose?: Function,
  onCloseText?: string,
  onNextPress?: Function,
  nextText?: string,
  nextIcon?: string,
  title?: string,
  centerTitle?: boolean,
  noPadding?: boolean,
  light?: boolean,
  style?: Object,
  headerRightFlex?: string,
  overlay?: boolean,
}

const Wrapper = styled.View`
  border-bottom-width: 0;
  padding: ${props => props.noPadding ? 0 : '0 20px'};
  height: 40px;
  justify-content: flex-end;
  align-items: flex-end;
  flex-direction: row;
  margin-top: ${Platform.OS === 'android' ? '20px' : '0'};
  margin-bottom: ${props => props.overlay ? '-40px' : '20px'};
  z-index: 10;
`;

const BackIcon = styled(ButtonIcon)`
  position: relative;
  align-self: flex-start;
  height: 44px;
  padding-right: 18px;
`;

const CloseIconText = styled(BaseText)`
  color: ${props => props.light ? baseColors.white : baseColors.darkGray};
  font-size: ${fontSizes.extraExtraSmall};
`;

const CloseIconWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
`;

const CloseIcon = styled(ButtonIcon)`
  height: 44px;
  padding-left: 18px;
`;

const NextIcon = styled(ButtonIcon)`
  height: 44px;
  padding-left: 18px;
`;

const HeaderLeft = styled(Left)`
  flex: ${props => props.showTitleLeft ? 2 : 1};
  justify-content: flex-start;
  align-items: flex-end;
`;

const HeaderBody = styled(Body)`
  flex: ${props => props.onCloseText ? 2 : 4};
`;

const HeaderRight = styled(Right)`
  flex: ${props => props.flex};
  justify-content: flex-end;
  align-items: flex-end;
`;

const Header = (props: Props) => {
  const {
    onBack,
    nextText,
    nextIcon,
    onNextPress,
    onClose,
    onCloseText,
    title,
    centerTitle,
    noPadding,
    style,
    light,
    headerRightFlex,
    overlay,
  } = props;
  const showRight = nextText || onBack || onClose;
  const titleOnBack = title && onBack;
  const showTitleCenter = titleOnBack || centerTitle;
  const showTitleLeft = !onBack && !centerTitle;
  const onlyCloseIcon = onClose && !nextText && !onCloseText;

  const getHeaderRightFlex = () => {
    if (headerRightFlex) {
      return headerRightFlex;
    } else if (onlyCloseIcon) {
      return '0 0 44px';
    }
    return 1;
  };

  return (
    <Wrapper overlay={overlay} style={style} noPadding={noPadding}>
      <HeaderLeft showTitleLeft={showTitleLeft}>
        {onBack &&
          <BackIcon
            icon="back"
            color={light ? baseColors.white : UIColors.primary}
            onPress={() => onBack()}
            fontSize={fontSizes.small}
          />
        }
        {showTitleLeft &&
          <Title noMargin title={title} />
        }
      </HeaderLeft>
      {showTitleCenter &&
        <HeaderBody onCloseText={onCloseText}>
          <Title align="center" noMargin title={title} />
        </HeaderBody >
      }
      {showRight &&
        <HeaderRight flex={getHeaderRightFlex} onClose={onClose || noop}>
          {nextText &&
            <TextLink onPress={onNextPress}>{nextText}</TextLink>
          }
          {nextIcon &&
            <NextIcon
              icon={nextIcon}
              color={light ? baseColors.white : UIColors.primary}
              onPress={onNextPress}
              fontSize={fontSizes.small}
            />
          }
          {onClose &&
            <CloseIconWrapper>
              {onCloseText &&
                <CloseIconText light={light} >{onCloseText}</CloseIconText>
              }
              <CloseIcon
                icon="close"
                color={light ? baseColors.white : UIColors.primary}
                onPress={onClose}
                fontSize={fontSizes.small}
              />
            </CloseIconWrapper>
          }
        </HeaderRight>
      }
    </Wrapper>
  );
};

export default Header;
