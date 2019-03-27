// @flow
import * as React from 'react';
import { Platform } from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { fontSizes, spacing, baseColors } from 'utils/variables';
import { Container, ScrollWrapper } from 'components/Layout';
import Header from 'components/Header';
import BadgeImage from 'components/BadgeImage';
import { BaseText, BoldText } from 'components/Typography';
import type { Badges } from 'models/Badge';

type Props = {
  badges: Badges,
  navigation: NavigationScreenProp<*>,
};

const BadgeWrapper = styled.View`
  position: relative;
  justify-content: center;
  align-items: center;
  margin: 5px 20px 20px;
  padding-top: ${Platform.select({
    ios: '20px',
    android: '14px',
  })};
`;

const Image = styled(BadgeImage)`
  margin-bottom: ${spacing.rhythm / 2};
`;

const Subtitle = styled(BoldText)`
  padding-top: 40px;
  font-size: ${fontSizes.semiGiant}px;
  text-align: center;
`;

const Description = styled(BaseText)`
  padding-top: 40px;
  font-size: ${fontSizes.small}px;
  color: ${baseColors.darkGray};
`;

class Badge extends React.Component<Props, {}> {
  shouldComponentUpdate(nextProps: Props) {
    const { navigation } = this.props;
    const oldBadgeId = navigation.getParam('id', null);
    const newBadgeId = nextProps.navigation.getParam('id', null);
    return oldBadgeId !== newBadgeId;
  }

  render() {
    const { navigation, badges } = this.props;
    const badgeId = Number(navigation.getParam('id', 0));
    const badge = badges.find(({ id }) => id === badgeId) || {};
    return (
      <Container inset={{ bottom: 0 }}>
        <Header
          title={badge.name || 'Unknown badge'}
          onBack={() => navigation.goBack(null)}
        />
        <ScrollWrapper>
          <BadgeWrapper>
            <Image data={badge} />
            {!!badge.subtitle && (
            <Subtitle>
              {badge.subtitle}
            </Subtitle>
            )}
            {!!badge.description && (
            <Description>
              {badge.description}
            </Description>
            )}
          </BadgeWrapper>
        </ScrollWrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({ badges: { data: badges } }) => ({ badges });

export default connect(mapStateToProps)(Badge);
