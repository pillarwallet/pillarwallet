// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Animated, Keyboard } from 'react-native';
import { Wrapper } from 'components/Layout';
import Header from 'components/Header';
import SearchBar from 'components/SearchBar';
import { baseColors } from 'utils/variables';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';

type State = {
  query: string,
  searchIsFocused: boolean,
  fullScreenOverlayOpacity: Animated.Value,
}

type Props = {
  navigation: NavigationScreenProp<*>,
  onSearchChange: Function,
  headerProps: Object,
  itemSearchState?: ?string,
  searchInputPlaceholder?: string,
  scrollShadow: boolean,
}

const HeaderWrapper = styled(Wrapper)`
  background-color: ${baseColors.snowWhite};
  z-index: 100;
  ${props => props.scrollShadow
    ? 'elevation: 3; shadow-color: #000; shadow-offset: 0 2px; shadow-opacity: 0.05; shadow-radius: 2;'
    : ''}
`;

const FullScreenOverlayWrapper = styled.TouchableOpacity`
  z-index: 10;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  position: absolute;
`;

const FullScreenOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,.6);
`;

const AnimatedFullScreenOverlay = Animated.createAnimatedComponent(FullScreenOverlay);

const MIN_QUERY_LENGTH = 2;

class SearchBlock extends React.Component<Props, State> {
  _willBlur: NavigationEventSubscription;

  constructor(props: Props) {
    super(props);
    this.state = {
      query: '',
      searchIsFocused: false,
      fullScreenOverlayOpacity: new Animated.Value(0),
    };
  }

  componentDidMount() {
    const { navigation } = this.props;
    this._willBlur = navigation.addListener('willBlur', this.onScreenBlur);
  }

  componentWillUnmount() {
    this._willBlur.remove();
  }

  onScreenBlur = () => {
    Keyboard.dismiss();
    this.animateFullScreenOverlayOpacity(true);
  };

  animateFullScreenOverlayOpacity = (active: boolean, onEnd?: Function) => {
    const { fullScreenOverlayOpacity } = this.state;
    if (!active) {
      fullScreenOverlayOpacity.setValue(0);
      Animated.timing(fullScreenOverlayOpacity, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }).start();
    } else {
      fullScreenOverlayOpacity.setValue(1);
      Animated.timing(fullScreenOverlayOpacity, {
        toValue: 0,
        duration: 80,
        useNativeDriver: true,
      }).start(() => onEnd && onEnd());
    }
  };

  handleSearchChange = (query: any) => {
    this.props.onSearchChange(query);
    this.setState({ query });
  };

  handleSearchBlur = () => {
    this.setState({
      searchIsFocused: false,
    });
    Keyboard.dismiss();
    this.animateFullScreenOverlayOpacity(true, this.animateAfterDelay);
  };

  handleSearchFocus = () => {
    this.setState({
      searchIsFocused: true,
    });
    this.animateFullScreenOverlayOpacity(false);
  };

  animateAfterDelay = () => {
    this.setState({
      searchIsFocused: false,
    });
  };

  render() {
    const {
      headerProps,
      itemSearchState,
      searchInputPlaceholder,
      scrollShadow,
    } = this.props;
    const {
      query,
      searchIsFocused,
      fullScreenOverlayOpacity,
    } = this.state;

    const inSearchMode = (query.length >= MIN_QUERY_LENGTH && !!itemSearchState);
    return (
      <React.Fragment>
        <HeaderWrapper scrollShadow={scrollShadow}>
          <Header {...headerProps} />
          <Wrapper regularPadding>
            <SearchBar
              inputProps={{
                onChange: this.handleSearchChange,
                onBlur: this.handleSearchBlur,
                onFocus: this.handleSearchFocus,
                value: query,
                autoCapitalize: 'none',
              }}
              placeholder={searchInputPlaceholder}
              marginTop={15}
            />
          </Wrapper>
        </HeaderWrapper>
        {!!searchIsFocused && !inSearchMode &&
        <FullScreenOverlayWrapper onPress={this.handleSearchBlur}>
          <AnimatedFullScreenOverlay
            style={{
              opacity: fullScreenOverlayOpacity,
            }}
          />
        </FullScreenOverlayWrapper>
        }
      </React.Fragment>
    );
  }
}

export default SearchBlock;
