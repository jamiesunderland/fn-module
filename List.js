//fnModule List {
//
//  sum(list) {
//    return this.sum(list, 0);
//  }
//
//  sum([], value) {
//    return value;
//  }
//
//  sum([head, ...tail], value) {
//    return this.sum(tail, head + value);
//  }
//
//  flatten(list) {
//    return this.flatten(list, [])
//  }
//
//  flatten([], newList) {
//    return newList;
//  }
//
//  flatten([ [head, ...t1], ...t2 ], newList) {
//    return this.flatten([head, ...[...t1, ...t2]], newList);
//  }
//
//  flatten([ [], ...tail ], newList) {
//    return this.flatten(tail, newList)
//  }
//
//  flatten([ head, ...tail ], newList) {
//    return this.flatten(tail, [...newList, head])
//  }
//}
//
//
//List.flatten([1,2,[3,[4,[5,6],[7],8,[9]],10,[[[11]]]]])
