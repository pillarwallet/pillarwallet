// @flow
import * as React from 'react';
import { Animated, TouchableHighlight } from 'react-native';
import { BaseText } from 'components/Typography';
import styled from 'styled-components/native';
import { UIColors, baseColors, fontSizes } from 'utils/variables';

const CheckboxBox = styled.View`
  width: 40;
  height: 40;
  margin-right: 20px;
  border-radius: 60;
  flex: 0 0 40px;
  border-width: 2;
  border-color: ${props => (props.active ? UIColors.primary : baseColors.mediumGray)}
`;

const CheckboxText = styled(BaseText)`
  flex: 1;
  font-size: ${fontSizes.medium};
`;

const CheckboxWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;
  opacity: ${props => props.disabled ? 0.5 : 1};
`;

const CheckboxBoxAnimated = Animated.createAnimatedComponent(CheckboxBox);

type Props = {
  text: string,
  onPress: Function,
  disabled?: boolean,
  checked?: boolean,
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

  toggleCheckBox = () => {
    const { animateActive, checked } = this.state;
    const { onPress, disabled } = this.props;
    if (!disabled) {
      this.setState({
        checked: !checked,
      },
      () => onPress(!checked),
      );

      if (checked) {
        Animated.spring(animateActive, {
          toValue: 4,
          duration: 600,
        }).start();
      } else {
        Animated.spring(animateActive, {
          toValue: 12,
          duration: 600,
        }).start();
      }
    }
  };

  render() {
    const { animateActive } = this.state;
    const {
      disabled,
      text,
    } = this.props;
    return (
      <TouchableHighlight
        onPress={() => this.toggleCheckBox()}
        underlayColor="transparent"
      >
        <CheckboxWrapper disabled={disabled}>
          <CheckboxBoxAnimated
            active={this.state.checked}
            style={{ borderWidth: animateActive }}
          />
          <CheckboxText>{text}</CheckboxText>
        </CheckboxWrapper>
      </TouchableHighlight>
    );
  }
}
