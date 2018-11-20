// @flow
import * as React from 'react';
import * as styled from './styles';

type Props = {
  children?: React.Node,
  title: string,
  onPress?: Function,
  disabled?: boolean,
  disabledTransparent?: boolean,
  secondary?: boolean,
  danger?: boolean,
  primaryInverted?: boolean,
  dangerInverted?: boolean,
  marginBottom?: string,
  marginTop?: string,
  marginLeft?: string,
  marginRight?: string,
  light?: boolean,
  width?: string,
  block?: boolean,
  noPadding?: boolean,
  flexRight?: boolean,
  small?: boolean,
  icon?: string,
  listItemButton?: boolean,
  alignTitleVertical?: boolean,
  isSquare?: boolean,
};

const getTheme = (props: Props) => {
  if (props.disabledTransparent) {
    return styled.themes.disabledTransparent;
  }
  if (props.disabled) {
    return styled.themes.disabled;
  }
  if (props.secondary && props.danger) {
    return styled.themes.secondaryDanger;
  }
  if (props.danger) {
    return styled.themes.danger;
  }
  if (props.secondary) {
    return styled.themes.secondary;
  }
  if (props.primaryInverted) {
    return styled.themes.primaryInverted;
  }
  if (props.dangerInverted) {
    return styled.themes.dangerInverted;
  }
  return styled.themes.primary;
};

const Button = (props: Props) => {
  const theme = getTheme(props);
  const {
    block,
    marginTop,
    marginBottom,
    icon,
    marginLeft,
    marginRight,
    noPadding,
    disabled,
    disabledTransparent,
    onPress,
    width,
    children,
  } = props;

  return (
    <styled.ButtonWrapper
      {...props}
      theme={theme}
      block={block}
      marginTop={marginTop}
      marginBottom={marginBottom}
      marginLeft={marginLeft}
      marginRight={marginRight}
      noPadding={noPadding}
      onPress={(disabled || disabledTransparent) ? null : onPress}
      width={width}
      disabled={disabled || disabledTransparent}
    >
      {!!icon && <styled.ButtonIcon name={icon} theme={theme} />}
      {!!props.title &&
      <styled.ButtonText
        theme={theme}
        small={props.small}
        listItemButton={props.listItemButton}
      >{props.title}
      </styled.ButtonText>}
      {children}
    </styled.ButtonWrapper>
  );
};

export default Button;

type ButtonMiniProps = {
  onPress: Function,
  title: string,
};

export const ButtonMini = (props: ButtonMiniProps) => (
  <styled.ButtonMiniWrapper onPress={props.onPress}>
    <ButtonMiniText>{props.title}</ButtonMiniText>
  </styled.ButtonMiniWrapper>
);
