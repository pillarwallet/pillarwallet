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
import { Keyboard } from 'react-native';
import SearchBar from 'components/SearchBar';
import Overlay from './Overlay';

type State = {
  query: string,
  searchIsFocused: boolean,
};

type Props = {
  onSearchChange: Function,
  itemSearchState?: boolean,
  searchInputPlaceholder?: string,
  backgroundColor?: string,
  hideSearch?: boolean,
  onSearchFocus?: Function,
  inputRef?: Function,
  wrapperStyle?: Object,
  onSearchBlur?: Function,
  hideOverlay?: boolean,
  disabled?: boolean,
};

const SearchBarWrapper = styled.View`
  width: 100%;
  position: relative;
  z-index: 101;
  background-color: ${({ isFocused, theme }) => isFocused ? theme.colors.basic070 : 'transparent'};
`;

const MIN_QUERY_LENGTH = 2;

class SearchBlock extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      query: '',
      searchIsFocused: false,
    };
  }

  handleSearchChange = (query: string) => {
    this.props.onSearchChange(query);
    this.setState({ query });
  };

  handleSearchBlur = () => {
    const { onSearchBlur } = this.props;
    if (onSearchBlur) onSearchBlur();
    this.setState({
      searchIsFocused: false,
    });
    Keyboard.dismiss();
  };

  handleSearchFocus = () => {
    const { onSearchFocus } = this.props;
    this.setState({
      searchIsFocused: true,
    });
    if (onSearchFocus) onSearchFocus();
  };

  animateAfterDelay = () => {
    this.setState({
      searchIsFocused: false,
    });
  };

  handleOverlayClick = () => {
    if (this.state.searchIsFocused) this.handleSearchBlur();
  }

  render() {
    const {
      itemSearchState,
      searchInputPlaceholder,
      hideSearch,
      wrapperStyle,
      inputRef,
      hideOverlay,
      disabled,
    } = this.props;
    const {
      query,
      searchIsFocused,
    } = this.state;

    const inSearchMode = query.length >= MIN_QUERY_LENGTH && itemSearchState;

    return (
      <React.Fragment>
        {!hideOverlay && (
          <Overlay
            active={searchIsFocused && !inSearchMode}
            fadeOutAnimationCallback={this.animateAfterDelay}
            handleClick={this.handleOverlayClick}
          />
        )}
        {!hideSearch &&
          <SearchBarWrapper
            style={wrapperStyle}
            isFocused={!!searchIsFocused && !inSearchMode}
            pointerEvents={disabled ? 'none' : 'auto'}
          >
            <SearchBar
              inputProps={{
                onChange: this.handleSearchChange,
                onBlur: this.handleSearchBlur,
                onFocus: this.handleSearchFocus,
                value: query,
                autoCapitalize: 'none',
              }}
              placeholder={searchInputPlaceholder}
              marginBottom="0"
              inputRef={inputRef}
            />
          </SearchBarWrapper>
        }
      </React.Fragment>
    );
  }
}

export default (SearchBlock);
