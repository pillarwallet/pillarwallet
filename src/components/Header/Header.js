// @flow
import * as React from 'react';
import { Left, Body, Right } from 'native-base';
import { TextLink, BaseText } from 'components/Typography';
import { UIColors, baseColors, fontSizes, spacing } from 'utils/variables';
import { noop } from 'utils/common';
import Title from 'components/Title';
import styled from 'styled-components/native';
import IconButton from 'components/IconButton';

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
  noMargin?: boolean,
  flexStart?: boolean,
  light?: boolean,
  style?: Object,
  headerRightFlex?: string,
  overlay?: boolean,
  backIcon?: string,
}

const Wrapper = styled.View`
  border-bottom-width: 0;
  padding: ${props => props.noPadding ? 0 : '0 20px'};
  height: 40px;
  justify-content: flex-end;
  align-items: flex-end;
  flex-direction: row;
  margin-top: ${spacing.rhythm};
  margin-bottom: ${props => props.flexStart ? 'auto' : 0};
  z-index: 10;
`;

const BackIcon = styled(IconButton)`
  position: relative;
  align-self: flex-start;
  height: 44px;
  width: 64px;
  padding-left: ${spacing.rhythm}px;
  margin-left: -${spacing.rhythm}px;
`;

const CloseIconText = styled(BaseText)`
  color: ${props => props.light ? baseColors.white : baseColors.darkGray};
  font-size: ${fontSizes.extraExtraSmall};
`;

const IconWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
`;

const NextIcon = styled(IconButton)`
  height: 44px;
  width: 64px;
  padding-right: ${spacing.rhythm}px;
  margin-right: -${spacing.rhythm}px;
  align-items: flex-end;
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
    noMargin,
    style,
    light,
    headerRightFlex,
    overlay,
    flexStart,
    backIcon,
  } = props;
  const showRight = nextText || nextIcon || onBack || onClose || centerTitle;
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
    <Wrapper overlay={overlay} noMargin={noMargin} flexStart={flexStart} style={style} noPadding={noPadding}>
      <HeaderLeft showTitleLeft={showTitleLeft}>
        {onBack &&
          <BackIcon
            icon={backIcon || 'back'}
            color={light ? baseColors.white : UIColors.defaultNavigationColor}
            onPress={() => onBack()}
            fontSize={fontSizes.extraLarge}
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
            <IconWrapper>
              <NextIcon
                icon={nextIcon}
                color={light ? baseColors.white : UIColors.primary}
                onPress={onNextPress}
                fontSize={fontSizes.small}
              />
            </IconWrapper>
          }
          {onClose &&
            <IconWrapper>
              {onCloseText &&
                <CloseIconText light={light} >{onCloseText}</CloseIconText>
              }
              <NextIcon
                icon="close"
                color={light ? baseColors.white : UIColors.defaultNavigationColor}
                onPress={onClose}
                fontSize={fontSizes.small}
              />
            </IconWrapper>
          }
        </HeaderRight>
      }
    </Wrapper>
  );
};

export default Header;
