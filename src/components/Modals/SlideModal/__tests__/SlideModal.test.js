// @flow
import * as React from 'react';
import { Text } from 'react-native';
import renderer from 'react-test-renderer';
import { shallow } from 'enzyme';
import ReactTestUtils from 'react-dom/test-utils';
import SlideModal from '../SlideModal';

describe('Slide Modal', () => {
  it('should render SlideModal correctly', () => {
    const component = renderer.create(<SlideModal title="title" isVisible />).toJSON();
    expect(component).toMatchSnapshot();
  });

  it('should render SlideModal with content', () => {
    const ChildContent = () => <Text>Test</Text>;
    const wrapper = shallow(<SlideModal title="title" isVisible><ChildContent /></SlideModal>);
    expect(wrapper.find(ChildContent)).toHaveLength(1);
  });

  it('should close modal on dismiss', () => {
    const component = renderer.create(<SlideModal title="title" isVisible />);
    const instance = component.root;
    const button = instance.findByProps({ icon: 'close' });
    button.props.onPress();
    expect(component.getInstance().state.isVisible).toBeFalsy();
  });
});
