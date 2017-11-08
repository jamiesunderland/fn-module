import { funstruct } from './funstruct.js'

funstruct List {

  sum(list) {
    return this.sum(list, 0);
  }

  sum([], value) {
    return value;
  }

  sum([head, ...tail], value) {
    return this.sum(tail, head + value);
  }

  flatten(list) {
    return this.flatten(list, [])
  }

  flatten([], newList) {
    return newList;
  }

  flatten([ [head, ...t1], ...t2 ], newList) {
    return this.flatten([head, ...[...t1, ...t2]], newList);
  }

  flatten([ [], ...tail ], newList) {
    return this.flatten(tail, newList)
  }

  flatten([ head, ...tail ], newList) {
    return this.flatten(tail, [...newList, head])
  }

  someFunction(n) when (n > 5) {
    return "n is greater than 5";
  }

  someFunction(n) {
    return "n is smaller than or equal to 5";
  }
}
