import React, { Component } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  Text,
  TouchableHighlight,
  Touchable,
} from 'react-native';

import OutlineButton from '../Buttons/OutlineButton';

// Please Implement Callback methods when using component
// @props
// var title : string = 'PopModal Header Text'
// var message : string  = 'PopModal Message'
// var actionPrimary : string = 'Primary Button Title'

// @required
// Handle Logic to Dimiss Popover
// popModalHandleDismiss(){} 

// Handle Logic to Primary Action
// popModalHandlePrimary(){} 

export default class PopModal extends Component { 
  //
    state = {
      showPopAnimation: new Animated.Value(0),
      verticalBounce: new Animated.Value(10),
    }

    componentDidMount(){

      Animated.parallel([
        
        Animated.timing(                 
          this.state.showPopAnimation, {
            toValue: 1,
            duration: 500,
        }),

        //BOUNCE ANIMATION
        Animated.sequence([

          Animated.timing(
            this.state.verticalBounce, {
            toValue: -20,
            easing: Easing.in(),
            duration: 350,
          }),
          Animated.timing(
            this.state.verticalBounce, {
            toValue: 5,
            duration: 180,
          }),
          Animated.timing(
            this.state.verticalBounce, {
            toValue: -2,
            duration: 90,
          }),
          Animated.timing(
            this.state.verticalBounce, {
            toValue: 0,
            duration: 30,
          }),
        ])
        
      ]).start();  

    }
  
    render(){

      let { showPopAnimation, verticalBounce } = this.state;

      return (
        <Animated.View style={[styles.popOverContainer, {opacity:showPopAnimation}]}>

          <TouchableHighlight style={styles.popOverContainerBG} onPress={this.props.popModalHandleDismiss}>
            <View />
          </TouchableHighlight>

          <Animated.View style={[styles.popOverBackground, {top: verticalBounce}]}>
            
            <View style={styles.popOverHeader}>
              <Text style={styles.popOverHeaderText}>{this.props.title}</Text>
            </View>

            <View style={styles.popOverContent}>
              <Text style={styles.popOverContentText}>{this.props.message}</Text>
            </View>

            <View style={styles.popOverActions}>
            <OutlineButton title={this.props.actionPrimary} onPress={this.props.popModalHandlePrimary}></OutlineButton>
            </View>
            
            </Animated.View>
        </Animated.View>
      );
    }
  }
  
  const styles = StyleSheet.create({
    popOverContainer: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },

    popOverContainerBG: {
      backgroundColor: 'black',
      position: 'absolute',
      width: '100%',
      height: '100%',
      opacity: 0.5,
    },

    popOverBackground: {
      width: '85%',
      margin: 'auto',
      height: 300,
      backgroundColor: '#01bbff',
      borderRadius: 10,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
    },

    popOverHeader: {
      alignItems: 'center',
      marginBottom:10,
    },

    popOverHeaderText: {
      color: 'white',
      fontSize: 28,
      fontWeight: 'bold',
    },

    popOverContentText: {
      color: 'white',
      fontSize: 14,
      fontWeight: 'bold',
    },

    popOverActions: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: 20,
    },

    popOverActionsText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },

  });