import IObject from 'redux/interfaces/IObject';
import { ReduxUnionType } from 'redux/redux-types/redux-union-type';

export interface IReduxActions {
  type: ReduxUnionType;
  payload?: IObject;
}
