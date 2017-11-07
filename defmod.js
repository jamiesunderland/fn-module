import {
  unwrap, 
  isIdentifier,
  isNumericLiteral, 
  isStringLiteral,
  isKeyword,
  isRegExp,
  isBraces,
  fromNumber,
  fromStringLiteral
  } from '@sweet-js/helpers' for syntax;

syntax fnModule = function(ctx) {

  var createFunction = function(result, fn, modName) {
    let funcBody = fn.reduce(evaluateFunctionDef, #``);
    let functionNamespace = modName.value + "." + fn.name
    let dummy = #`dummy`.get(0);
    let def = #`${modName}.${fn.name} = function() {
      switch (true) {
        ${funcBody}
        default:
          return new Error("no definition found for " + ${fromStringLiteral(dummy, functionNamespace)} + " with arity " + arguments.length)
          break;
      }
    }`;

    return result.concat(def);
  }

  var evaluateFunctionDef = function(result, {body, params}) {

      let conditional = getConditionalObject(params, [], []); 
      const condition = {
        arity: conditional[conditional.length - 1] !== undefined ? conditional[conditional.length - 1].arity : 0,
        type: 'array',
        value: conditional,
        path: [],
        isEmpty: conditional.length === 0,
      }
      let conditionLiteral = buildCondition(condition); 
      let dummy = #`dummy`.get(0);
      let conditionTemplate = #`eval(${fromStringLiteral(dummy, conditionLiteral)})`; 
      let localVars =  [];
      setLocalVariables(condition, undefined, localVars, {});
      let variableTemplate = #`eval(${fromStringLiteral(dummy, localVars.join(' '))})`; 
      return result.concat(#`
                           case ${conditionTemplate}:
                             ${variableTemplate}
                             ${body}
                             break;
                           `)
  }

  var getConditionalObject = function(params, path=[], conditional=[]) {
    if (conditional instanceof Array) {
      let arity = 0;
      let isSpread = false;
      let paramsCtx = ctx.contextify(params);
      for (let param of paramsCtx) {
        if (param.value && param.value.token && param.value.token.value === ',') { 
          arity++;
          continue
        } else if (param.value && param.value.token && param.value.token.value === '...') {
          isSpread = true;
          continue;
        } else  {
          let def = {};
          if (param.value && param.value.token) {
            if (isIdentifier(param)) {
              def.type = 'var';
              def.path = [...path, arity];
              def.arity = arity;
              def.value = unwrap(param).value;
              def.isSpread = isSpread;
              isSpread = false;
            } else if (isNumericLiteral(param)) {
              def.type = 'number';
              def.path = [...path, arity];
              def.arity = arity;
              def.value = unwrap(param).value;
            } else if (isStringLiteral(param)) {
              def.type = 'string';
              def.path = [...path, arity];
              def.arity = arity;
              def.value = unwrap(param).value;
            } else if (isKeyword(param))  {
              def.type = 'boolean';
              def.path = [...path, arity];
              def.arity = arity;
              def.value = unwrap(param).value;
            } else if (isRegExp(param))  {
              def.type = 'regex';
              def.path = [...path, arity];
              def.arity = arity;
              def.value = unwrap(param).value;
            }

          } else if (isBraces(param)) {
              def.type = 'object';
              def.path = [...path, arity];
              def.arity = arity;
              def.value = getConditionalObject(param, [...path, arity], {});
              def.isEmpty = def.value.length === 0
              def.isSpread = isSpread;
              isSpread = false;
          } else {
              def.type = 'array';
              def.path = [...path, arity];
              def.arity = arity;
              def.value = getConditionalObject(param, [...path, arity], []);
              def.isEmpty = def.value.length === 0
              def.isSpread = isSpread;
              isSpread = false;
          }
          conditional.push(def);
        }
      } 
      conditional.arity = arity;
    } else { 
      let isSpread = false;
      let hasAssertion = false;
      let paramsCtx = ctx.contextify(params);
      let lastDef;

      for (let param of paramsCtx) { 
        if (param.value && param.value.token && param.value.token.value === ',') { 
          continue
        } else if (param.value && param.value.token && param.value.token.value === '...') {
          isSpread = true;
          continue;
        } else if (param.value && param.value.token && param.value.token.value === ':') {
          hasAssertion = true;
          continue;
        } else  { 
          let def = {};
          if (param.value && param.value.token) {
            if (isIdentifier(param)) {
              def.type = 'var';
              def.path = [...path, unwrap(param).value];
              def.value = unwrap(param).value;
              def.isSpread = isSpread;
              isSpread = false;
            } else if (isNumericLiteral(param)) {
              def.type = 'number';
              def.path = [...path, lastDef.value];
              def.value = unwrap(param).value;
            } else if (isStringLiteral(param)) {
              def.type = 'string';
              def.path = [...path, lastDef.value];
              def.value = unwrap(param).value;
            } else if (isKeyword(param))  {
              def.type = 'boolean';
              def.path = [...path, lastDef.value];
              def.value = unwrap(param).value;
            } else if (isRegExp(param))  {
              def.type = 'regex';
              def.path = [...path, lastDef.value];
              def.value = unwrap(param).value;
            }

          } else if (isBraces(param)) {
              def.type = 'object';
              def.path = [...path, lastDef.value];
              def.value = getConditionalObject(param, [...path, lastDef.value], {});
              def.isEmpty = Object.keys(def.value).length === 0
              def.isSpread = isSpread;
              isSpread = false;
          } else {
              def.type = 'array';
              def.path = [...path, lastDef.value];
              def.value = getConditionalObject(param, [...path, lastDef.value], []);
              def.isEmpty = def.value.length === 0
              def.isSpread = isSpread;
              isSpread = false;
          }

          if (hasAssertion) {
            lastDef.assertion = def;
            hasAssertion = false;
          } else {
            lastDef = def;
            conditional[param.value] = def;
          }
        }
      }
    }

    return conditional
  }


  var setLocalVariables = function(condition, rhs="Array.prototype.slice.call(arguments, 0)", args=[],  visited={}) {

    if (condition.type === 'array') { 
      condition.value.forEach((v, i) => setLocalVariables(v, v.isSpread ? rhs + ".slice(" + v.arity + ")" : rhs + "[" + v.arity + "]", args, visited, true))
    } else if (condition.type === 'object') {
      //sort objects on spreadability
      //deassign properties if spread is true
      var sortedObjectsKeys = Object.keys(condition.value).sort(k => {
        return condition.value[k].isSpread ? 1 : -1;
      });
      sortedObjectsKeys.forEach((k, i) => {
        let object = condition.value[k];
        if (object.isSpread) {
          setLocalVariables(condition.value[k], "Object.assign(" + rhs + ", {})", args, visited, false)
          const deassignString = sortedObjectsKeys.slice(0, i).map(x => "delete " + k + "[\"" + x + "\"]; ").join(''); 
          args.push(deassignString)
        } else {
          setLocalVariables(condition.value[k], rhs + "[\"" + k + "\"]", args, visited, false)
        }
      })
    } else if (condition.type === 'var') {
      if (visited[condition.value]) {
        console.error("duplicate definitions for " + condition.value)
        process.exit();
      }

      visited[condition.value] = true;
      args.push("var " + condition.value + " = " + rhs + ";");
      if (condition.assertion) {
        setLocalVariables(condition.assertion, rhs, args, visited, condition.assertion.type === 'array')
      }
    }
  }

  var buildCondition = function(condition) {
    let result = '';
    if (condition.value[condition.value.length - 1] && condition.value[condition.value.length - 1].isSpread) {
      return "arguments.length >= " + (condition.arity - 1) + " " + iterateCondition(condition);
    } else {
      const arity = Math.max(condition.arity === undefined ? 0 : condition.arity + 1,  condition.value.length);
      return "arguments.length === " + arity + " " + iterateCondition(condition);
    }
  }

  var iterateCondition = function(condition) {
    let result = '';
    // the original arguments
    if (condition.path.length === 0) {
      return condition.value.map(iterateCondition).join('');
    }
    if (condition.type !== 'var') {
      let exists = existenceCheck(condition.path); 
      result = " && " +  exists + result;
    }
    let def = "Array.prototype.slice.call(arguments, 0)" +  condition.path.map(p => "[\"" + p + "\"]").join('');
    if (condition.type === 'array') {
      result = result + " && " + def + " instanceof Array "; 

      if (condition.value[condition.value.length - 1] && condition.value[condition.value.length - 1].isSpread) {
        result = result + " && " + def + ".length >= " + (condition.value.length - 1 );
      } else {
        result = result + " && " + def + ".length === " + condition.value.length;
      }
      return result + condition.value.map(iterateCondition).join('');
    } else if (condition.type === 'object') {
      result = result + " && typeof " + def + " === \"object\" "; 
      if (condition.isEmpty) {
        result = result + "&& Object.keys( " + def + " ).length === 0 "; 
      }
      return result + Object.keys(condition.value).map((key) => iterateCondition(condition.value[key]) ).join('');
    } else {
      switch (condition.type) {
        case 'string':
          return result + " && " + def + " === \"" + condition.value + "\" ";
        case 'number':
        case 'boolean':
          return result + " && " + def + " === " + condition.value + " ";
        case 'regex':
          return result + " && " + condition.value + ".test( " + def + " ) ";
        case 'var':
          if (typeof condition.path[condition.path.length - 1] === "string" && !condition.isSpread) {
            result = result + " && " + def + " !== undefined ";
          }
          if (condition.assertion) {
            return result + iterateCondition(condition.assertion);
          }
          return result;
        default:
          return result;
      }
    }
  }

  var existenceCheck = function(path=[]) {
    let result = '';
    for (var i = 0; i < path.length; ++i) {
      let subPath = path.slice(0, i + 1);
      let subPathString = subPath.reduce((s, j) =>  s + "[\"" + j + "\"]", "")
      let subCondition = "Array.prototype.slice.call(arguments, 0)" + subPathString + " !== undefined "; 
      result = result + subCondition;
      if (i !== path.length - 1) {
        result = result + " && ";
      }
    }

    return result;
  }

  let name = ctx.next().value;
  let bodyCtx = ctx.contextify(ctx.next().value);
  let init = #`var ${name} = {};`;
  let fns = {};
  
  for (let item of bodyCtx) { 
    if (fns[item.value] === undefined) {
      fns[item.value] = [];
      fns[item.value].name = item.value;
    }

    let params = bodyCtx.next().value;
    let body = bodyCtx.next().value;
    fns[item.value].push({
      params,
      body
    });
  }

  var result = Object
  .keys(fns)
  .reduce( (result, key) => createFunction( result, fns[key], name), #``);

  return init.concat(result);
}
