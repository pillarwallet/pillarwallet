// @flow
import * as React from 'react';
import { Platform } from 'react-native';
import { format } from 'date-fns';
import styled from 'styled-components/native';
import { MediumText, BaseText } from 'components/Typography';
import { CachedImage } from 'react-native-cached-image';
import { getCurrencySymbol, formatMoney } from 'utils/common';
import { spacing, fontSizes, fontTrackings, baseColors, UIColors } from 'utils/variables';
import LinearGradient from 'react-native-linear-gradient';
import Countdown from 'components/Countdown';
import TruncatedText from 'components/TruncatedText';
import CircularProgress from 'components/CircularStatus';

type Props = {
  id: string,
  title: string,
  status?: string,
  onPress: Function,
  endDate: any,
  goalCurrency: string,
  goal: number,
  raised: number,
  inner?: boolean,
  iconUrl?: string,
  description?: string,
}

const isLabelOutside = (raisedAmount) => { return raisedAmount <= 10; };

const CardWrapper = styled.View`
  width: 100%;
`;

const InnerWrapper = styled.View`
  flex-direction: column;
  padding-bottom: 10px;
  margin: ${Platform.select({
    ios: props => props.inner ? `3px ${spacing.rhythm / 2}px 10px` : `3px ${spacing.rhythm / 2}px 5px`,
    android: props => props.inner ? `2px ${spacing.rhythm / 2}px 10px` : `2px ${spacing.rhythm / 2}px 6px`,
  })}
  shadow-color: ${UIColors.cardShadowColor};
  shadow-offset: 0 3px;
  shadow-opacity: 1;
  shadow-radius: 6px;
  elevation: 3;
  border-radius: 8px;
  background: ${baseColors.white};
`;

const Row = styled.View`
  flex-direction: row;
  justify-content: ${props => props.alignCenter ? 'center' : 'space-between'};
  align-items: ${props => props.alignTop ? 'flex-start' : 'center'};
  padding: ${props => props.halfPadding ? '0 8px' : '0 16px'}; 
  margin-top: ${props => props.marginTop ? props.marginTop : 0}px;
`;

const ProgressBar = styled.View`
  flex-direction: row;
  background-color: ${baseColors.snowWhite};
  padding: 1px 0;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: ${spacing.rhythm / 2}px;
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
  margin-top: 28px;
  margin-bottom: ${props => props.inner ? spacing.rhythm / 2 : 28}px;
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
  width: ${props => props.width ? props.width : 'auto'};
  flex-direction: column;
  align-items: ${props => props.center ? 'center' : 'flex-start'};
  justify-content: flex-start;
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
  font-size: ${props => props.xl ? fontSizes.medium : fontSizes.extraSmall};
  line-height: ${fontSizes.mediumLarge};
  color: ${baseColors.slateBlack};
  letter-spacing: ${fontTrackings.tiny};
`;

const IcoCard = (props: Props) => {
  const {
    id,
    title,
    status,
    goal,
    raised,
    goalCurrency,
    endDate,
    onPress,
    inner,
    description,
    iconUrl,
  } = props;

  const raisedInPercent = (Math.floor((raised / goal) * 100));
  const labelOutside = isLabelOutside(raisedInPercent);
  const goalCurrencySymbol = getCurrencySymbol(goalCurrency) || goalCurrency;
  // Adroid does not show rounded corner on 50%;
  const adjustedRaisedInPercent = raisedInPercent === 50 ? 50.5 : raisedInPercent;

  return (
    <CardWrapper>
      <TouchableWithoutFeedback onPress={onPress}>
        <InnerWrapper inner={inner}>
          <Row>
            <TitleWrapper inner={inner}>
              <Title>{title}</Title>
              {!!status &&
              <Label>
                <LabelText>
                  {status.toUpperCase()}
                </LabelText>
              </Label>}
            </TitleWrapper>
            {!inner &&
            <CachedImage
              key={id}
              style={{
                height: 60,
                width: 60,
              }}
              source={{ uri: iconUrl }}
              resizeMode="contain"
            />}
          </Row>
          {!!inner && !!description &&
          <Row>
            <TruncatedText text={description} />
          </Row>}
          {!!inner &&
          <Row alignCenter marginTop={26}>
            <Column center>
              <ColumnValue xl>
                802
              </ColumnValue>
              <ColumnLabel>
                Investors
              </ColumnLabel>
            </Column>
            <Column center>
              <ColumnValue xl>
                63.6%
              </ColumnValue>
              <ColumnLabel>
                Tokens sold
              </ColumnLabel>
            </Column>
            <Column center>
              <ColumnValue xl>
                12 days
              </ColumnValue>
              <ColumnLabel>
                Time left
              </ColumnLabel>
            </Column>
          </Row>}
          {!inner &&
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
          </ProgressBar>}
          {!inner &&
          <Row alignTop halfPadding>
            <Column width="33.33333%">
              <ColumnLabel>
                Goal
              </ColumnLabel>
              <ColumnValue>
                {goalCurrencySymbol}{formatMoney(goal, 0, 3, ',', '.', false)}
              </ColumnValue>
            </Column>
            <Column width="33.33333%">
              <ColumnLabel>
                End date
              </ColumnLabel>
              <ColumnValue>
                {format(new Date(endDate), 'D MMM YYYY')}
              </ColumnValue>
            </Column>
            <Column width="33.33333%">
              <ColumnLabel>
                Time left
              </ColumnLabel>
              <Countdown endDate={endDate} />
            </Column>
          </Row>}
          {!!inner &&
          <Row alignCenter>
            <CircularProgress
              circleSize={180}
              statusWidth={16}
              status={adjustedRaisedInPercent}
              label={raisedInPercent.toString()}
              statusBackgroundWidth={22}
            >
              <CachedImage
                key={id}
                style={{
                  height: 90,
                  width: 90,
                }}
                source={{ uri: iconUrl }}
                resizeMode="contain"
              />
            </CircularProgress>
          </Row>}
        </InnerWrapper>
      </TouchableWithoutFeedback>
    </CardWrapper>
  );
};

export default IcoCard;
