// @flow
import * as React from 'react';
import { Animated, TouchableHighlight } from 'react-native';
import { BaseText } from 'components/Typography';
import styled from 'styled-components/native';
import { UIColors, baseColors, fontSizes, spacing } from 'utils/variables';
import Icon from 'components/Icon';

const CheckboxBox = styled.View`
  width: 24;
  height: 24;
  margin-right: ${spacing.mediumLarge}px;
  border-radius: 2px;
  flex: 0 0 24px;
  border-width: 1px;
  border-color: ${props => (props.active ? UIColors.primary : baseColors.mediumGray)}
  justify-content: center;
  align-items: center;
`;

const CheckboxText = styled(BaseText)`
  flex: 1;
  font-size: ${fontSizes.medium};
`;

const TextWrapper = styled.View`
  flex: 1;
`;

const CheckboxWrapper = styled.View`
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 20px;
  opacity: ${props => props.disabled ? 0.5 : 1};
`;

type Props = {
  text?: string,
  onPress: Function,
  disabled?: boolean,
  checked?: boolean,
  children?: React.Node,
};

type State = {
  checked: boolean,
  animateActive: Animated.Value,
};

export default class Checkbox extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      checked: !!props.checked,
      animateActive: new Animated.Value(props.checked ? 12 : 4),
    };
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.disabled !== this.props.disabled && this.props.disabled) {
      this.toggleCheckBox(false);
    }
  }

  animateCheckBox = (checked: boolean) => {
    const { animateActive } = this.state;
    if (!checked) {
      Animated.spring(animateActive, {
        toValue: 1,
        duration: 600,
      }).start();
    } else {
      Animated.spring(animateActive, {
        toValue: 12,
        duration: 600,
      }).start();
    }
  };

  toggleOnPress = (checkedStatus: boolean) => {
    if (!this.props.disabled) {
      this.props.onPress(checkedStatus);
    }
  };

  toggleCheckBox = (status?: boolean) => {
    const { checked } = this.state;
    const { disabled } = this.props;
    const checkedStatus = disabled ? false : status || !checked;
    this.setState({ checked: checkedStatus }, () => this.toggleOnPress(checkedStatus));
    this.animateCheckBox(checkedStatus);
  };

  render() {
    const { checked } = this.state;
    const { disabled, text, children } = this.props;
    return (
      <TouchableHighlight
        onPress={() => this.toggleCheckBox()}
        underlayColor="transparent"
      >
        <CheckboxWrapper disabled={disabled}>
          <CheckboxBox active={disabled ? false : checked}>
            {!!checked &&
            <Icon
              name="check"
              style={{
                color: baseColors.brightBlue,
                fontSize: fontSizes.extraExtraSmall,
              }}
            />
            }
          </CheckboxBox>
          {!!text && <CheckboxText>{text}</CheckboxText>}
          {!!children && <TextWrapper>{children}</TextWrapper>}
        </CheckboxWrapper>
      </TouchableHighlight>
    );
  }
}
