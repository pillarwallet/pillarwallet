// @flow
import * as React from 'react';
import { Platform } from 'react-native';
import { format, differenceInDays } from 'date-fns';
import styled from 'styled-components/native';
import { MediumText, BaseText } from 'components/Typography';
import { CachedImage } from 'react-native-cached-image';
import { getCurrencySymbol, formatMoney } from 'utils/common';
import { spacing, fontSizes, fontTrackings, baseColors, UIColors } from 'utils/variables';
import Countdown from 'components/Countdown';
import TruncatedText from 'components/TruncatedText';
import ProgressCircle from 'components/ProgressCircle';
import ProgressBar from 'components/ProgressBar';

type Props = {
  id: string,
  title: string,
  status?: string,
  onPress: Function,
  endDate: any,
  startDate: any,
  goalCurrency: string,
  goal: number,
  tokensSold: number,
  totalSupply: number,
  inner?: boolean,
  iconUrl?: string,
  description?: string,
  isPending: boolean,
}

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
  align-items: ${props => props.alignVertical ? props.alignVertical : 'center'};
  padding: ${props => props.halfPadding ? '0 8px' : '0 16px'}; 
  margin-top: ${props => props.marginTop ? props.marginTop : 0}px;
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
  padding-right: ${spacing.rhythm / 2}px;
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
  margin-top: 2px;
`;

const IcoCard = (props: Props) => {
  const {
    id,
    title,
    status,
    goal,
    tokensSold,
    totalSupply,
    goalCurrency,
    startDate,
    endDate,
    onPress,
    inner,
    description,
    iconUrl,
    isPending,
  } = props;

  const tokensSoldInPercent = (tokensSold * 100) / totalSupply;
  const goalCurrencySymbol = getCurrencySymbol(goalCurrency) || goalCurrency;

  const timerLabel = isPending ? 'Starts in' : 'Time left';
  const InnerCountDown = () => {
    const remainingTimeInDays = isPending ?
      differenceInDays(startDate, new Date()) :
      differenceInDays(endDate, new Date());

    if (remainingTimeInDays < 1) {
      return (
        <Countdown
          endDate={isPending ? startDate : endDate}
          fontSize={fontSizes.medium}
          lineHeight={fontSizes.mediumLarge}
        />
      );
    }
    return (
      <ColumnValue xl>
        {remainingTimeInDays} {remainingTimeInDays === 1 ? 'day' : 'days'}
      </ColumnValue>
    );
  };

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
            <TruncatedText lines={4} text={description} />
          </Row>}
          {!!inner &&
          <Row alignVertical="flex-end" alignCenter marginTop={26}>
            <Column center width="50%">
              <ColumnValue xl>
                {tokensSoldInPercent}%
              </ColumnValue>
              <ColumnLabel>
                Tokens sold
              </ColumnLabel>
            </Column>
            <Column center width="50%">
              <InnerCountDown />
              <ColumnLabel>
                {timerLabel}
              </ColumnLabel>
            </Column>
          </Row>}
          {!inner &&
          <ProgressBar
            isPending={isPending}
            endDate={endDate}
            startDate={startDate}
          />}
          {!inner &&
          <Row alignVertical="flex-start" halfPadding>
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
                {timerLabel}
              </ColumnLabel>
              <Countdown endDate={isPending ? startDate : endDate} lineHeight={fontSizes.mediumLarge} />
            </Column>
          </Row>}
          {!!inner &&
          <Row alignCenter>
            <ProgressCircle
              isPending={isPending}
              endDate={endDate}
              startDate={startDate}
              circleSize={180}
              statusWidth={16}
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
            </ProgressCircle>
          </Row>}
        </InnerWrapper>
      </TouchableWithoutFeedback>
    </CardWrapper>
  );
};

export default IcoCard;
