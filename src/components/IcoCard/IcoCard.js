// @flow
import * as React from 'react';
import { Platform } from 'react-native';
import styled from 'styled-components/native';
import { MediumText, BaseText } from 'components/Typography';
import { CachedImage } from 'react-native-cached-image';
import { getCurrencySymbol, formatMoney } from 'utils/common';
import { spacing, fontSizes, fontTrackings, baseColors, UIColors } from 'utils/variables';
import LinearGradient from 'react-native-linear-gradient';
import Countdown from 'components/Countdown';

type Props = {
  name: string,
  status?: string,
  onPress: Function,
  endDate: any,
  goalCurrency: string,
  goal: number,
  raised: number
}

const isLabelOutside = (raisedAmount) => { return raisedAmount <= 10; };

const CardWrapper = styled.View`
  margin: ${Platform.select({
    ios: `3px ${spacing.rhythm / 2}px 5px`,
    android: `2px ${spacing.rhythm / 2}px 6px`,
  })}
  flex-direction: row;
  shadow-color: ${UIColors.cardShadowColor};
  shadow-offset: 0 3px;
  shadow-opacity: 1;
  shadow-radius: 6px;
  elevation: 3;
  border-radius: 8px;
  background: ${baseColors.white};
`;

const InnerWrapper = styled.View`
  flex: 1;
  flex-direction: column;
  padding-top: 12px;
`;

const Row = styled.View`
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: ${props => props.alignTop ? 'flex-start' : 'center'};
  padding: ${props => props.halfPadding ? spacing.rhythm / 2 : spacing.rhythm}px; 
`;

const ProgressBar = styled.View`
  flex: 1;
  flex-direction: row;
  background-color: ${baseColors.snowWhite};
  padding: 1px 0;
  align-items: center;
  justify-content: flex-start;
  margin-top: 6px;
`;

const StyledLinearGradient = styled(LinearGradient)`
  padding: 1px;
  height: 11px;
  width: ${props => props.progress}%;
  border-top-right-radius: ${props => props.full ? 0 : '9px'};
  border-bottom-right-radius: ${props => props.full ? 0 : '9px'};
  overflow: hidden;
`;

const ProgressLabel = styled(MediumText)`
  font-size: ${fontSizes.tiny};
  line-height: ${fontSizes.tiny};
  letter-spacing: ${fontTrackings.tiny};
  color: ${props => props.outside ? baseColors.oliveDrab : baseColors.white};
  position: ${props => props.outside ? 'relative' : 'absolute'};
  top: ${Platform.select({
    ios: props => props.outside ? 'auto' : '1px',
    android: props => props.outside ? 'auto' : '1.5px',
  })};
  right: ${props => props.outside ? 'auto' : '4px'};
  margin-top: ${Platform.select({
    ios: props => props.outside ? '1px' : '0',
    android: props => props.outside ? '2px' : '0',
  })};
  margin-left: ${props => props.outside ? '2px' : 0};
`;

const TouchableWithoutFeedback = styled.TouchableWithoutFeedback`
  z-index: 10;
`;

const TitleWrapper = styled.View`
  flex: 1;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
`;

const Title = styled(MediumText)`
  font-size: ${fontSizes.extraLarger};
  line-height: ${fontSizes.extraExtraLarge};
  color: ${baseColors.slateBlack};
  margin-right: 8px;
`;

const Label = styled.View`
  padding: 1px 4px;
  border-radius: 4px;
  background-color: ${baseColors.beige};
  border-width: 1px;
  border-color: ${baseColors.coconutCream};
  margin: 4px 0;
`;

const LabelText = styled(MediumText)`
  font-size: ${fontSizes.tiny};
  line-height: ${fontSizes.extraExtraSmall};
  color: ${baseColors.pineGlade};
  margin-top: ${Platform.select({
    ios: 0,
    android: '1px',
  })};
  text-align-vertical: center;
`;

const Column = styled.View`
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  flex: 1;
  padding: ${spacing.rhythm / 2}px;
`;

const ColumnLabel = styled(BaseText)`
  font-size: ${fontSizes.extraSmall};
  line-height: ${fontSizes.small};
  letter-spacing: ${fontTrackings.tiny};
  color: ${baseColors.darkGray};
  margin-bottom: 2px;
`;

const ColumnValue = styled(MediumText)`
  font-size: ${fontSizes.extraSmall};
  line-height: ${fontSizes.mediumLarge};
  color: ${baseColors.slateBlack};
  letter-spacing: ${fontTrackings.tiny};
`;

const IcoCard = (props: Props) => {
  const {
    name,
    status,
    goal,
    raised,
    goalCurrency,
    endDate,
    onPress,
  } = props;

  const raisedInPercent = (Math.floor((raised / goal) * 100));
  const labelOutside = isLabelOutside(raisedInPercent);
  const goalCurrencySymbol = getCurrencySymbol(goalCurrency);

  return (
    <CardWrapper>
      <TouchableWithoutFeedback onPress={onPress}>
        <InnerWrapper>
          <Row>
            <TitleWrapper>
              <Title>{name}</Title>
              {!!status &&
              <Label>
                <LabelText>
                  {status.toUpperCase()}
                </LabelText>
              </Label>}
            </TitleWrapper>
            <CachedImage
              key={name}
              style={{
                height: 60,
                width: 60,
              }}
              source={{ uri: 'https://mediaserver.responsesource.com/press-release/81489/TwentyThirty+offical+logo.png' }}
              resizeMode="contain"
            />
          </Row>
          <ProgressBar>
            <StyledLinearGradient
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              colors={[baseColors.mantis, baseColors.oliveDrab]}
              progress={raisedInPercent}
              full={raisedInPercent === 100}
            >
              {!labelOutside &&
              <ProgressLabel>{raisedInPercent}%</ProgressLabel>}
            </StyledLinearGradient>
            {!!labelOutside &&
            <ProgressLabel outside={labelOutside}>{raisedInPercent}%</ProgressLabel>}
          </ProgressBar>
          <Row alignTop halfPadding>
            <Column>
              <ColumnLabel>
                Goal
              </ColumnLabel>
              <ColumnValue>
                {goalCurrencySymbol}{formatMoney(goal, 0, 3, ',', '.', false)}
              </ColumnValue>
            </Column>
            <Column>
              <ColumnLabel>
                End date
              </ColumnLabel>
              <ColumnValue>
                {endDate}
              </ColumnValue>
            </Column>
            <Column>
              <ColumnLabel>
                Time left
              </ColumnLabel>
              <Countdown endDate={endDate} />
            </Column>
          </Row>
        </InnerWrapper>
      </TouchableWithoutFeedback>
    </CardWrapper>
  );
};

export default IcoCard;
