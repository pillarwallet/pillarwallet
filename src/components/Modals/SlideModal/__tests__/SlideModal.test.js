// @flow
import * as React from 'react';
import renderer from 'react-test-renderer';
import { BaseText } from 'components/Typography';
import { shallow } from 'enzyme';
import SlideModal from '../SlideModal';

describe('Slide Modal', () => {
  it('should render SlideModal correctly', () => {
    const component = renderer.create(<SlideModal title="title" isVisible />).toJSON();
    expect(component).toMatchSnapshot();
  });

  it('should render SlideModal with content', () => {
    const ChildContent = () => <BaseText>Test</BaseText>;
    const wrapper = shallow(<SlideModal title="title" isVisible><ChildContent /></SlideModal>);
    expect(wrapper.find(ChildContent)).toHaveLength(1);
  });

  it('should close modal on dismiss', () => {
    const onModalHide = jest.fn();
    const component = renderer.create(<SlideModal title="title" isVisible onModalHide={onModalHide} />);
    const instance = component.root;
    const button = instance.findByProps({ icon: 'close' });
    button.props.onPress();
    expect(onModalHide).toHaveBeenCalled();
  });
});
