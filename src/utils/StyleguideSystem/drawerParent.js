import React, { Component } from 'react';
import { baseColors } from 'utils/variables';
import * as styled from './styles';

class DrawerSection extends Component {
  state = {
    isCollapsed: false,
  };

  componentDidMount() {
    const { shouldCollapse } = this.props;
    const { isCollapsed } = this.state;

    if (shouldCollapse !== isCollapsed) {
      this.toggleCollapsed();
    }
  }

  toggleCollapsed = () => {
    this.setState({ isCollapsed: !this.state.isCollapsed });
  };

  render() {
    const {
      children,
      title,
      sectionColor,
      sectionHeight,
      sectionFontSize,
      levelPosition,
    } = this.props;
    const { isCollapsed } = this.state;

    return (
      <styled.Parent
        isCollapsed={isCollapsed}
        sectionHeight={sectionHeight}
        levelPosition={levelPosition}
        sectionColor={sectionColor}
      >
        <styled.ParentSection
          sectionColor={sectionColor}
          sectionHeight={sectionHeight}
        >
          <styled.ParentName
            sectionFontSize={sectionFontSize}
            onPress={this.toggleCollapsed}
          >
            {title}
          </styled.ParentName>
        </styled.ParentSection>

        {children}
      </styled.Parent>
    );
  }
}

DrawerSection.defaultProps = {
  sectionColor: baseColors.darkGray,
  sectionHeight: 32,
  sectionFontSize: 20,
  levelPosition: 1,
};

export default DrawerSection;
