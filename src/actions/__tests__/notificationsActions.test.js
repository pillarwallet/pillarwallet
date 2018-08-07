// @flow
import * as notificationsActions from '../notificationsActions';

const BCX = 'BCX';

const createGetStateFn = (assets) => {
  return () => ({
    assets: {
      data: assets,
      supportedAssets: [
        { symbol: 'AAA', lorem: 100 },
        { symbol: 'BBB', lorem: 100 },
      ],
    },
  });
};

describe('notificationsActions', () => {
  const { getAssets } = notificationsActions;

  describe('getAssets()', () => {
    describe('when notification type is NOT BCX', () => {
      it('should return selected assets', () => {
        const assets = {};
        const getState = createGetStateFn(assets);
        const notification = { type: 'notBCX' };

        expect(getAssets(getState, notification)).toEqual(assets);
      });
    });

    describe('when notification type is BCX', () => {
      describe('and notification asset is in the assets map', () => {
        it('should return selected assets', () => {
          const assets = { AAA: { symbol: 'AAA' } };
          const getState = createGetStateFn(assets);
          const notification = { type: BCX, asset: 'AAA' };

          expect(getAssets(getState, notification)).toEqual(assets);
        });
      });

      describe('and notification asset is NOT in the selected assets map', () => {
        describe('and the extra asset can NOT be found', () => {
          it('should return selected assets', () => {
            const assets = { AAA: { symbol: 'AAA' } };
            const getState = createGetStateFn(assets);
            const notification = { type: BCX, asset: 'notInList' };

            expect(getAssets(getState, notification)).toEqual(assets);
          });
        });

        describe('and the extra asset can be found', () => {
          it('should add the new asset to the selected assets map', () => {
            const assets = { AAA: { symbol: 'AAA' } };
            const getState = createGetStateFn(assets);
            const notification = { type: BCX, asset: 'BBB' };

            expect(getAssets(getState, notification)).toEqual({
              ...assets,
              BBB: { symbol: 'BBB', lorem: 100 },
            });
          });
        });
      });
    });
  });
});
