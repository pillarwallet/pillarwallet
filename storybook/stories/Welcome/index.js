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
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  showApp?: () => void,
}

export default class Welcome extends React.Component<Props> {
  styles: StyleSheet.Styles;

  constructor(props: Props) {
    super(props);
    this.styles = {
      wrapper: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
      },
      header: {
        fontSize: 18,
        marginBottom: 18,
      },
      content: {
        fontSize: 12,
        marginBottom: 10,
        lineHeight: 18,
      },
    };
  }

  showApp = () => {
    const { showApp } = this.props;

    if (showApp) {
      showApp();
    }
  };

  render() {
    return (
      <View style={this.styles.wrapper}>
        <Text style={this.styles.header}>Welcome to React Native Storybook</Text>
        <Text style={this.styles.content}>
          This is a UI Component development environment for your React Native app. Here you can
          display and interact with your UI components as stories. A story is a single state of one
          or more UI components. You can have as many stories as you want. In other words a story is
          like a visual test case.
        </Text>
        <Text style={this.styles.content}>
          We have added some stories inside the &quot;storybook/stories&quot; directory for examples. Try
          editing the &quot;storybook/stories/Welcome.js&quot; file to edit this message.
        </Text>
      </View>
    );
  }
}
