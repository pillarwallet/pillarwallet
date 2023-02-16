/**
 * PlayM - Play your favourite songs without any interruption..
 *
 */

import React, { useRef } from 'react';
import { StyleSheet, Animated, View, Dimensions } from 'react-native';

// Utils
import { useThemeColors } from 'utils/themes';

const HEADER_MAX_HEIGHT = 240;
const HEADER_MIN_HEIGHT = 80;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const { height } = Dimensions.get('window');

interface Props {
  headerContent: any;
  searchContent: any;
  maincontent: any;
  query: any;
}

function AnimationScroll({ headerContent, searchContent, maincontent, query }: Props) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const colors = useThemeColors();
  const scrollRef: any = useRef();

  React.useEffect(() => {
    if (!scrollRef || !query) return;
    scrollRef?.current?.scrollTo({ animated: true, y: HEADER_SCROLL_DISTANCE, x: 0 });
  }, [scrollRef, query]);

  const titleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.999, 0.998],
    extrapolate: 'clamp',
  });
  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [-HEADER_MAX_HEIGHT, -HEADER_SCROLL_DISTANCE / 2, -1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.safeArea}>
      <Animated.ScrollView
        key={'_list_content'}
        bounces={false}
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={1}
        removeClippedSubviews={true}
        contentContainerStyle={{
          backgroundColor: colors.background,
        }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        <Animated.View style={styles.mainContent}>
          {headerContent}
          {maincontent}
        </Animated.View>
      </Animated.ScrollView>

      <Animated.View
        style={[
          styles.topBar,
          {
            transform: [{ scale: titleScale }, { translateY: titleTranslateY }],
            backgroundColor: colors.background,
          },
        ]}
      >
        {searchContent}
      </Animated.View>
    </View>
  );
}

export default AnimationScroll;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  headerBackground: {
    resizeMode: 'cover',
    height: HEADER_MIN_HEIGHT,
  },
  topBar: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    height: HEADER_MIN_HEIGHT,
    zIndex: 11,
  },
  mainContent: {
    minHeight: height + HEADER_MIN_HEIGHT * 0.95,
  },
});
