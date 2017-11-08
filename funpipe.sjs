'lang sweet.js';

export operator @ left 1 = (left, right) => {
  return #`${right.callee}(${left}, ${right.arguments})`;
};
