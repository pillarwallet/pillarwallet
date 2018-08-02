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
  title?: string,
  centerTitle?: boolean,
  noPadding?: boolean,
  headerRightFlex?: string,
}

const Wrapper = styled.View`
  border-bottom-width: 0;
  padding: ${props => props.noPadding ? 0 : '0 16px'};
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
  height: 32px;
  padding-right: 10px;
`;

const CloseIconText = styled(BaseText)`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.extraExtraSmall};
`;

const CloseIconWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
`;

const CloseIcon = styled(ButtonIcon)`
  height: 32px;
  padding-left: 10px;
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
    onNextPress,
    onClose,
    onCloseText,
    title,
    small,
    centerTitle,
    noPadding,
    headerRightFlex,
  } = props;
  const showRight = nextText || onBack || onClose;
  const titleOnBack = title && onBack;
  const showTitleCenter = titleOnBack || centerTitle;
  const showTitleLeft = !onBack && !centerTitle;
  const onlyCloseIcon = onClose && !nextText && !onCloseText;

  const getHeaderRightFlex = () => {
    if (headerRightFlex) {
      return headerRightFlex;
    } else if (small) {
      return '0 0 44px';
    }
    return 1;
  };

  return (
    <Wrapper noPadding={noPadding}>
      <HeaderLeft showTitleLeft={showTitleLeft}>
        {onBack &&
          <BackIcon
            icon="back"
            color={UIColors.primary}
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
        <HeaderRight flex={getHeaderRightFlex} small={onlyCloseIcon} onClose={onClose || noop}>
          {nextText &&
            <TextLink onPress={onNextPress}>{nextText}</TextLink>
          }
          {onClose &&
            <CloseIconWrapper>
              {onCloseText &&
                <CloseIconText>{onCloseText}</CloseIconText>
              }
              <CloseIcon icon="close" color={UIColors.primary} onPress={() => onClose()} fontSize={fontSizes.small} />
            </CloseIconWrapper>
          }
        </HeaderRight>
      }
    </Wrapper>
  );
};

export default Header;
