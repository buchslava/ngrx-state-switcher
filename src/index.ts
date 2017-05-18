import { Action } from '@ngrx/store';
import { isEmpty, last, tail, initial, head } from 'lodash';

const getInitSwitcherState = (reducer: Function) => {
  return {
    past: [],
    present: reducer(undefined, {type: '__INIT__'}),
    future: []
  };
};

const getUndoState = state => {
  if (isEmpty(state._STATE_SWITCHER.past)) {
    return state;
  }

  const previous = last(state._STATE_SWITCHER.past);
  const newPast = initial(state._STATE_SWITCHER.past);

  return Object.assign({}, previous, {
    _STATE_SWITCHER: {
      past: newPast,
      present: previous,
      future: [state._STATE_SWITCHER.present, ...state._STATE_SWITCHER.future]
    }
  });
};

const getRedoState = state => {
  if (isEmpty(state._STATE_SWITCHER.future)) {
    return state;
  }

  const next = head(state._STATE_SWITCHER.future);
  const newFuture = tail(state._STATE_SWITCHER.future);

  return Object.assign({}, next, {
    _STATE_SWITCHER: {
      past: [...state._STATE_SWITCHER.past, state._STATE_SWITCHER.present],
      present: next,
      future: newFuture
    }
  });
};

const getNormalizedState = (reducer: Function, state) => {
  const initState = !state || !state._STATE_SWITCHER ? getInitSwitcherState(reducer) : {};

  return Object.assign({}, {_STATE_SWITCHER: initState}, state);
};

export const UNDO = 'UNDO';
export const REDO = 'REDO';

export enum Policy {
  ALWAYS,
  FIRST_ONLY,
  EXCEPT_FIRST
}

export interface StateSwitchPolicy {
  actionName: string;
  policy: Policy;
}

export class StateSwitcher {
  private passedActionNames: Set<string> = new Set<string>();

  constructor(private actionsUnderPolicy: StateSwitchPolicy[] = []) {
  }

  preventDefaultInit() {
    this.actionsUnderPolicy.push({
      actionName: '@ngrx/store/init',
      policy: Policy.ALWAYS
    });

    return this;
  }

  getStateReducer(): Function {
    return (reducer: Function) => {
      return (state, action: Action) => {
        const normalizedState = getNormalizedState(reducer, state);

        if (action.type === UNDO) {
          return getUndoState(normalizedState);
        }

        if (action.type === REDO) {
          return getRedoState(normalizedState);
        }

        return this.getGenericState(reducer, normalizedState, action);
      };
    };
  }

  private getGenericState(reducer: Function, state, action: Action) {
    const newPresent = reducer(state, action);

    if (state._STATE_SWITCHER.present === newPresent) {
      return newPresent;
    }

    const newStateSwitcher = this.isStateDenied(action) ? {
      _STATE_SWITCHER: {
        past: [...state._STATE_SWITCHER.past, state._STATE_SWITCHER.present],
        present: newPresent,
        future: []
      }
    } : {};

    this.passedActionNames.add(action.type);

    return Object.assign({}, newPresent, newStateSwitcher);
  }

  private isStateDenied(currentAction: Action): boolean {
    const actionPolicy = this.actionsUnderPolicy
      .find((action: StateSwitchPolicy) => action.actionName === currentAction.type);

    if (!actionPolicy) {
      return true;
    }

    if (actionPolicy.policy === Policy.ALWAYS) {
      return false;
    }

    if (this.passedActionNames.has(currentAction.type) && actionPolicy.policy === Policy.EXCEPT_FIRST) {
      return false;
    }

    if (!this.passedActionNames.has(currentAction.type) && actionPolicy.policy === Policy.FIRST_ONLY) {
      return false;
    }

    return true;
  }
}
