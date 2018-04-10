import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableHighlight,
} from 'react-native';

// Please Implement Callback methods when using component
// @props
// var title : string 

// @required Any action for onPressDefinition
// onPress(){}

export default class OutlineButton extends Component { 
    render(){
      return (
        <TouchableHighlight style={styles.defaultBtn} onPress={this.props.onPress}>
            <Text style={styles.defaultBtnTitle}>{this.props.title}</Text>
        </TouchableHighlight>
      );
    }
  }
  
  const styles = StyleSheet.create({
    defaultBtn: {
      alignItems: 'center',
      padding: 10,
      borderRadius: 10 * 2,
      borderColor: 'white',
      borderWidth: 2,
      width: '80%',
    },

    defaultBtnTitle:{
      color: 'white',
      fontWeight: 'bold',
    }
    
  });