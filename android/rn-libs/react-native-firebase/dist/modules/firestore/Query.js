/**
 * 
 * Query representation wrapper
 */
import DocumentSnapshot from './DocumentSnapshot';
import FieldPath from './FieldPath';
import QuerySnapshot from './QuerySnapshot';
import { buildNativeArray, buildTypeMap } from './utils/serialize';
import { getAppEventName, SharedEventEmitter } from '../../utils/events';
import { getLogger } from '../../utils/log';
import { firestoreAutoId, isFunction, isObject } from '../../utils';
import { getNativeModule } from '../../utils/native';

const DIRECTIONS = {
  ASC: 'ASCENDING',
  asc: 'ASCENDING',
  DESC: 'DESCENDING',
  desc: 'DESCENDING'
};

const OPERATORS = {
  '=': 'EQUAL',
  '==': 'EQUAL',
  '>': 'GREATER_THAN',
  '>=': 'GREATER_THAN_OR_EQUAL',
  '<': 'LESS_THAN',
  '<=': 'LESS_THAN_OR_EQUAL'
};

const buildNativeFieldPath = fieldPath => {
  if (fieldPath instanceof FieldPath) {
    return {
      elements: fieldPath._segments,
      type: 'fieldpath'
    };
  }
  return {
    string: fieldPath,
    type: 'string'
  };
};

/**
 * @class Query
 */
export default class Query {

  constructor(firestore, path, fieldFilters, fieldOrders, queryOptions) {
    this._fieldFilters = fieldFilters || [];
    this._fieldOrders = fieldOrders || [];
    this._firestore = firestore;
    this._queryOptions = queryOptions || {};
    this._referencePath = path;
  }

  get firestore() {
    return this._firestore;
  }

  endAt(...snapshotOrVarArgs) {
    const options = {
      ...this._queryOptions,
      endAt: this._buildOrderByOption(snapshotOrVarArgs)
    };

    return new Query(this.firestore, this._referencePath, this._fieldFilters, this._fieldOrders, options);
  }

  endBefore(...snapshotOrVarArgs) {
    const options = {
      ...this._queryOptions,
      endBefore: this._buildOrderByOption(snapshotOrVarArgs)
    };

    return new Query(this.firestore, this._referencePath, this._fieldFilters, this._fieldOrders, options);
  }

  get() {
    return getNativeModule(this._firestore).collectionGet(this._referencePath.relativeName, this._fieldFilters, this._fieldOrders, this._queryOptions).then(nativeData => new QuerySnapshot(this._firestore, this, nativeData));
  }

  limit(limit) {
    // TODO: Validation
    // validate.isInteger('n', n);

    const options = {
      ...this._queryOptions,
      limit
    };
    return new Query(this.firestore, this._referencePath, this._fieldFilters, this._fieldOrders, options);
  }

  onSnapshot(optionsOrObserverOrOnNext, observerOrOnNextOrOnError, onError) {
    let observer;
    let metadataChanges = {};
    // Called with: onNext, ?onError
    if (isFunction(optionsOrObserverOrOnNext)) {
      if (observerOrOnNextOrOnError && !isFunction(observerOrOnNextOrOnError)) {
        throw new Error('Query.onSnapshot failed: Second argument must be a valid function.');
      }
      // $FlowExpectedError: Not coping with the overloaded method signature
      observer = {
        next: optionsOrObserverOrOnNext,
        error: observerOrOnNextOrOnError
      };
    } else if (optionsOrObserverOrOnNext && isObject(optionsOrObserverOrOnNext)) {
      // Called with: Observer
      if (optionsOrObserverOrOnNext.next) {
        if (isFunction(optionsOrObserverOrOnNext.next)) {
          if (optionsOrObserverOrOnNext.error && !isFunction(optionsOrObserverOrOnNext.error)) {
            throw new Error('Query.onSnapshot failed: Observer.error must be a valid function.');
          }
          // $FlowExpectedError: Not coping with the overloaded method signature
          observer = {
            next: optionsOrObserverOrOnNext.next,
            error: optionsOrObserverOrOnNext.error
          };
        } else {
          throw new Error('Query.onSnapshot failed: Observer.next must be a valid function.');
        }
      } else if (Object.prototype.hasOwnProperty.call(optionsOrObserverOrOnNext, 'includeMetadataChanges')) {
        metadataChanges = optionsOrObserverOrOnNext;
        // Called with: Options, onNext, ?onError
        if (isFunction(observerOrOnNextOrOnError)) {
          if (onError && !isFunction(onError)) {
            throw new Error('Query.onSnapshot failed: Third argument must be a valid function.');
          }
          // $FlowExpectedError: Not coping with the overloaded method signature
          observer = {
            next: observerOrOnNextOrOnError,
            error: onError
          };
          // Called with Options, Observer
        } else if (observerOrOnNextOrOnError && isObject(observerOrOnNextOrOnError) && observerOrOnNextOrOnError.next) {
          if (isFunction(observerOrOnNextOrOnError.next)) {
            if (observerOrOnNextOrOnError.error && !isFunction(observerOrOnNextOrOnError.error)) {
              throw new Error('Query.onSnapshot failed: Observer.error must be a valid function.');
            }
            observer = {
              next: observerOrOnNextOrOnError.next,
              error: observerOrOnNextOrOnError.error
            };
          } else {
            throw new Error('Query.onSnapshot failed: Observer.next must be a valid function.');
          }
        } else {
          throw new Error('Query.onSnapshot failed: Second argument must be a function or observer.');
        }
      } else {
        throw new Error('Query.onSnapshot failed: First argument must be a function, observer or options.');
      }
    } else {
      throw new Error('Query.onSnapshot failed: Called with invalid arguments.');
    }
    const listenerId = firestoreAutoId();

    const listener = nativeQuerySnapshot => {
      const querySnapshot = new QuerySnapshot(this._firestore, this, nativeQuerySnapshot);
      observer.next(querySnapshot);
    };

    // Listen to snapshot events
    SharedEventEmitter.addListener(getAppEventName(this._firestore, `onQuerySnapshot:${listenerId}`), listener);

    // Listen for snapshot error events
    if (observer.error) {
      SharedEventEmitter.addListener(getAppEventName(this._firestore, `onQuerySnapshotError:${listenerId}`), observer.error);
    }

    // Add the native listener
    getNativeModule(this._firestore).collectionOnSnapshot(this._referencePath.relativeName, this._fieldFilters, this._fieldOrders, this._queryOptions, listenerId, metadataChanges);

    // Return an unsubscribe method
    return this._offCollectionSnapshot.bind(this, listenerId, listener);
  }

  orderBy(fieldPath, directionStr = 'asc') {
    // TODO: Validation
    // validate.isFieldPath('fieldPath', fieldPath);
    // validate.isOptionalFieldOrder('directionStr', directionStr);

    if (this._queryOptions.startAt || this._queryOptions.startAfter || this._queryOptions.endAt || this._queryOptions.endBefore) {
      throw new Error('Cannot specify an orderBy() constraint after calling ' + 'startAt(), startAfter(), endBefore() or endAt().');
    }

    const newOrder = {
      direction: DIRECTIONS[directionStr],
      fieldPath: buildNativeFieldPath(fieldPath)
    };
    const combinedOrders = this._fieldOrders.concat(newOrder);
    return new Query(this.firestore, this._referencePath, this._fieldFilters, combinedOrders, this._queryOptions);
  }

  startAfter(...snapshotOrVarArgs) {
    const options = {
      ...this._queryOptions,
      startAfter: this._buildOrderByOption(snapshotOrVarArgs)
    };

    return new Query(this.firestore, this._referencePath, this._fieldFilters, this._fieldOrders, options);
  }

  startAt(...snapshotOrVarArgs) {
    const options = {
      ...this._queryOptions,
      startAt: this._buildOrderByOption(snapshotOrVarArgs)
    };

    return new Query(this.firestore, this._referencePath, this._fieldFilters, this._fieldOrders, options);
  }

  where(fieldPath, opStr, value) {
    // TODO: Validation
    // validate.isFieldPath('fieldPath', fieldPath);
    // validate.isFieldFilter('fieldFilter', opStr, value);
    const nativeValue = buildTypeMap(value);
    const newFilter = {
      fieldPath: buildNativeFieldPath(fieldPath),
      operator: OPERATORS[opStr],
      value: nativeValue
    };
    const combinedFilters = this._fieldFilters.concat(newFilter);
    return new Query(this.firestore, this._referencePath, combinedFilters, this._fieldOrders, this._queryOptions);
  }

  /**
   * INTERNALS
   */

  _buildOrderByOption(snapshotOrVarArgs) {
    // TODO: Validation
    let values;
    if (snapshotOrVarArgs.length === 1 && snapshotOrVarArgs[0] instanceof DocumentSnapshot) {
      const docSnapshot = snapshotOrVarArgs[0];
      values = [];
      for (let i = 0; i < this._fieldOrders.length; i++) {
        const fieldOrder = this._fieldOrders[i];
        if (fieldOrder.fieldPath.type === 'string' && fieldOrder.fieldPath.string) {
          values.push(docSnapshot.get(fieldOrder.fieldPath.string));
        } else if (fieldOrder.fieldPath.fieldpath) {
          const fieldPath = new FieldPath(...fieldOrder.fieldPath.fieldpath);
          values.push(docSnapshot.get(fieldPath));
        }
      }
    } else {
      values = snapshotOrVarArgs;
    }

    return buildNativeArray(values);
  }

  /**
   * Remove query snapshot listener
   * @param listener
   */
  _offCollectionSnapshot(listenerId, listener) {
    getLogger(this._firestore).info('Removing onQuerySnapshot listener');
    SharedEventEmitter.removeListener(getAppEventName(this._firestore, `onQuerySnapshot:${listenerId}`), listener);
    SharedEventEmitter.removeListener(getAppEventName(this._firestore, `onQuerySnapshotError:${listenerId}`), listener);
    getNativeModule(this._firestore).collectionOffSnapshot(this._referencePath.relativeName, this._fieldFilters, this._fieldOrders, this._queryOptions, listenerId);
  }
}