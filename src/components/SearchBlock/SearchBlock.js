// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
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
}

const HeaderWrapper = styled(Wrapper)`
  background-color: ${baseColors.snowWhite};
  z-index: 100;
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
    } = this.props;
    const {
      query,
      searchIsFocused,
      fullScreenOverlayOpacity,
    } = this.state;

    const inSearchMode = (query.length >= MIN_QUERY_LENGTH && !!itemSearchState);
    return (
      <React.Fragment>
        <HeaderWrapper>
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
