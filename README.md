# ngrx-state-switcher
State switcher meta reducer for @ngrx/store (`Undo`-`Redo` functionality).

## Dependencies
`ngrx-state-switcher` depends on [@ngrx/store](https://github.com/ngrx/store) and [Angular 2](https://github.com/angular/angular).

## Usage
```bash
npm install ngrx-state-switcher --save
```

1. Import `compose` and `combineReducers` from `@ngrx/store` and `@ngrx/core/compose`
2. Import `StateSwitcher` class from `ngrx-state-switcher`;
3. Create instance of `StateSwitcher` class
5. Invoke `getStateReducer` method of `StateSwitcher` and get result (as function, let it be `stateSwitchReducer`).
6. Add `combineReducers` after stateSwitchReducer and invoke composed function with application reducers as an argument to `provideStore`.

```ts
import {bootstrap} from '@angular/platform-browser-dynamic';
import {TodoApp} from './todo-app';
import {provideStore, combineReducers} from "@ngrx/store";
import {compose} from "@ngrx/core/compose";
import { StateSwitcher } from 'ngrx-state-switcher';
import {todos, visibilityFilter} from './reducers';

export function main() {
  const stateSwitcher = new StateSwitcher();
  const stateSwitchReducer: Function = stateSwitcher.getStateReducer();

  return bootstrap(TodoApp, [
      //taking all logging defaults
      //todos and visibilityFilter are just sample reducers
      provideStore(
        compose(
            stateSwitchReducer,
            combineReducers
        )({todos, visibilityFilter})
      ),
  ])
  .catch(err => console.error(err));
}

document.addEventListener('DOMContentLoaded', main);
```

## API

### `StateSwitcher(actionsUnderPolicy: StateSwitchPolicy[]);`

#### Arguments
* `actionsUnderPolicy` \(array of `StateSwitchPolicy`): names of actions that will be excluded from `StateSwitcher` flow.

```
export enum Policy {
  ALWAYS,
  FIRST_ONLY,
  EXCEPT_FIRST
}

export interface StateSwitchPolicy {
  actionName: string;
  policy: Policy;
}
```

Apart from that you can use `preventDefaultInit` method of `StateSwitcher` class to exclude default `ngrx` actions from `StateSwitcher` flow.

### Example

```ts
import { compose } from '@ngrx/core/compose';
import { combineReducers } from '@ngrx/store';

import todosReducer, * as fromTodos from './todos.reducer';
import visibilityFilter from './visibiltyFilter.reducer';
import { TodoFilter } from '../models/filter.model';
import { TodoActions } from '../actions/todo.actions';
import { StateSwitcher, Policy } from './state-switcher';

export interface AppState {
  todos: fromTodos.TodosState;
  filter: TodoFilter;
}

const stateSwitcher = new StateSwitcher([
  {actionName: TodoActions.GET_TODOS, policy: Policy.ALWAYS},
  {actionName: TodoActions.ADD_TODO, policy: Policy.ALWAYS}
]).preventDefaultInit();
const stateSwitchReducer: Function = stateSwitcher.getStateReducer();

export default compose(stateSwitchReducer, storeLogger(), combineReducers)({
  todos: todosReducer,
  filter: visibilityFilter
});

export const getTodosState = (state: AppState) => state.todos;
export const getFilterState = (state: AppState) => state.filter;
```

You can see [here](https://github.com/buchslava/electron-ngrx-rich-starter/blob/master/src/app/reducers/index.ts) working example.
