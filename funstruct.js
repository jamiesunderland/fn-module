import {
  unwrap, 
  isIdentifier,
  isNumericLiteral, 
  isStringLiteral,
  isTemplate,
  isKeyword,
  isRegExp,
  isBraces,
  fromNumber,
  fromStringLiteral,
  fromParens,
  fromKeyword,
  fromIdentifier,
  fromBraces
  } from '@sweet-js/helpers' for syntax;

'lang sweet.js';

export default syntax funstruct = function(ctx) {

  var createFunction = function(result, fn, modName) {
    let funcBody = fn.reduce(evaluateFunctionDef, #``);
    let functionNamespace = modName.value + "." + fn.name;
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

  var evaluateFunctionDef = function(result, {body, params, when}) {
      let conditional = getConditionalObject(params, [], []); 
      const condition = {
        arity: conditional.arity,
        type: 'array',
        value: conditional,
        path: [],
        isSpread: conditional.isSpread,
        isEmpty: conditional.length === 0,
      };
      let conditionLiteral = buildCondition(condition); 
      let dummy = #`dummy`.get(0);
      let conditionTemplate = #`eval(${fromStringLiteral(dummy, conditionLiteral)})`; 
      let localVars =  [];
      setLocalVariables(condition, undefined, localVars, {});
      let variableTemplate = #`eval(${fromStringLiteral(dummy, localVars.join(' '))})`; 
      let bodyTemplate = getBodyTemplate(body, when);
      return result.concat(#`
                           case ${conditionTemplate}:
                             ${variableTemplate}
                             ${bodyTemplate}
                           `);
  }

  var getBodyTemplate = function(body, when) {
    if (!when) {
      return #`if(true) ${body}`;
    }
    let whenCondition = getStringFromTemplate(when)
    let dummy = #`dummy`.get(0);
    return #`
      if(eval(${fromStringLiteral(dummy, whenCondition)})) {
        if(true)${body}
        break;
      }`;
  }

  var getConditionalObject = function(params, path=[], conditional=[]) {
    let lastDef;
    if (conditional instanceof Array) {
      let arity = 0;
      conditional.arity = 1;
      let isSpread = false;
      let paramsCtx = ctx.contextify(params);
      for (let param of paramsCtx) {
        if (param.value && param.value.token && param.value.token.value === ',') { 
          arity++;
          conditional.arity++;
          continue;
        } else if (param.value && param.value.token && param.value.token.value === '...') {
          isSpread = true;
          conditional.isSpread = isSpread;
          continue;
        } else if (param.value && param.value.token && param.value.token.value === '=') {
          let _default = getDefaultValue(paramsCtx);
          lastDef._default = getStringFromTemplate(_default);
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
            if (conditional.arity === 1) {
              conditional.arity++;
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
          lastDef = def;
          conditional.push(def);
        }
      } 
    } else { 
      let isSpread = false;
      let hasAssertion = false;
      let paramsCtx = ctx.contextify(params);
      for (let param of paramsCtx) { 
        if (param.value && param.value.token && param.value.token.value === ',') { 
          continue;
        } else if (param.value && param.value.token && param.value.token.value === '...') {
          isSpread = true;
          continue;
        } else if (param.value && param.value.token && param.value.token.value === ':') {
          hasAssertion = true;
          continue;
        } else if (param.value && param.value.token && param.value.token.value === '=') {
          let _default = getDefaultValue(paramsCtx);
          lastDef._default = getStringFromTemplate(_default);
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
              def.isEmpty = def.value.length === 0;
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
    return conditional;
  }

  var getDefaultValue = function(paramsCtx) {
    let result = #``;
    let marker;
    for (let param of paramsCtx) { 
      if (param.value && param.value.token && param.value.token.value === ',') { 
        paramsCtx.reset(marker);
        return result;
      }
      result = result.concat(param);
      marker = paramsCtx.mark();
    } 
    return result;
  }

  var getStringFromTemplate = function(_default) {
    if (_default.inner) {
      return getStringFromTemplate(_default.inner);
    }
    let result = '';
    _default.forEach((v) => {
      result = result + ' ';
      if (v.inner) {
        result = result + getStringFromTemplate(v);
      } else {
        if (isStringLiteral(v)) {
          result = result + "\"" + unwrap(v).value + "\"";
        } else if (isTemplate(v)) {
          result = result +  v.value.token.slice.text;
        }else {
          result = result + unwrap(v).value;
        }
      }
    });
    return result;
  }

  var setLocalVariables = function(condition, rhs="Array.prototype.slice.call(arguments, 0)", args=[], visited={}) {
    let dummy = #`dummy`.get(0);
    if (condition.type === 'array') { 
      condition.value.forEach((v, i) =>{
        setLocalVariables(v, v.isSpread ? rhs + ".slice(" + v.arity + ")" : rhs + "[" + v.arity + "]", args, visited, true);
      });
    } else if (condition.type === 'object') {
      var sortedObjectsKeys = Object.keys(condition.value).sort(k => {
        return condition.value[k].isSpread ? 1 : -1;
      });
      sortedObjectsKeys.forEach((k, i) => {
        let object = condition.value[k];
        if (object.isSpread) {
          setLocalVariables(condition.value[k], "Object.assign(" + rhs + ", {})", args, visited);
          const deassignString = sortedObjectsKeys.slice(0, i).map(x => "delete " + k + "[\"" + x + "\"]; ").join(''); 
          args.push(deassignString);
        } else {
          setLocalVariables(condition.value[k], rhs + "[\"" + k + "\"]", args, visited);
        }
      });
    } else if (condition.type === 'var') {
      if (visited[condition.value]) {
        //TODO: make more descriptive
        console.error("duplicate definitions for " + condition.value);
        process.exit();
      }
      visited[condition.value] = true;
      args.push("var " + condition.value + " = " + rhs + ";");
      if (condition.assertion) {
        setLocalVariables(condition.assertion, rhs, args, visited);
      }
      if (condition._default) {
        args.push('if(' + condition.value  + '===undefined){  ' + condition.value  + '=' + condition._default +';}; ');
      }
    }
  }

  var buildCondition = function(condition) {
    let result = '';
    if (condition.isSpread) {
      return "arguments.length >= " + Math.max(0, condition.arity - 2) + " " + iterateCondition(condition);
    } else {
      return "arguments.length === " + (condition.arity - 1) + " " + iterateCondition(condition);
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

      if (condition.value.isSpread) {
        result = result + " && " + def + ".length >= " + Math.max(0, condition.value.arity - 2);
      } else {
        result = result + " && " + def + ".length === " + (condition.value.arity - 1);
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
          if (typeof condition.path[condition.path.length - 1] === "string" && !condition.isSpread && !condition._default) {
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
  let marker = ctx.mark();
  let test = ctx.next().value;
  let init;
  let bodyCtx;
  if (unwrap(test).value === 'extends') {
    let extending = ctx.next().value; 
    bodyCtx = ctx.contextify(ctx.next().value);
    init = #`var ${name} = Object.assign({}, ${extending});`;
  } else {
    ctx.reset(marker);
    bodyCtx = ctx.contextify(ctx.next().value);
    init = #`var ${name} = {};`;
  }
  let fns = {};
  for (let item of bodyCtx) { 
    if (fns[item.value] === undefined) {
      fns[item.value] = [];
      fns[item.value].name = item.value;
    }
    let params = bodyCtx.next().value;
    marker = bodyCtx.mark();
    let whenTest = bodyCtx.next().value; 
    if (unwrap(whenTest).value === 'when') {
      let when = bodyCtx.next().value; 
      let body = bodyCtx.next().value;
      fns[item.value].push({
        params,
        body,
        when
      });
    } else {
      bodyCtx.reset(marker);
      let body = bodyCtx.next().value;
      fns[item.value].push({
        params,
        body
      });
    }
  }
  var result = Object
  .keys(fns)
  .reduce( (result, key) => createFunction( result, fns[key], name), #``);
  return init.concat(result);
}
