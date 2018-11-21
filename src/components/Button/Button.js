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
  height?: string,
};

const getTheme = (props: Props) => {
  const propsKeys = Object.keys(props);
  const themes = Object.keys(styled.themes);
  let themeToUse = styled.themes.primary;

  propsKeys.some((prop: string) => {
    const indexOfTheme = themes.indexOf(prop);
    const existTheme = indexOfTheme >= 0;

    if (existTheme) {
      themeToUse = styled.themes[prop];
    }

    return existTheme;
  });

  return themeToUse;
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
    height,
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
      height={height}
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
    <styled.ButtonMiniText>{props.title}</styled.ButtonMiniText>
  </styled.ButtonMiniWrapper>
);
