const { intValue, nullValue, boolValue } = require('./value')

function evaluatorError(ast) {
  return {
    error: {
      type: 'EvaluatorError',
      message: `無効なast'${ast.type}'が渡されました`,
      ast,
    },
  }
}

function typeError(type) {
  return {
    error: {
      type: 'TypeError',
      message: `無効な型'${type}'が渡されました`,
    },
  }
}

function argumentsCountError(name, want, got) {
  return {
    error: {
      type: 'ArgumentsCountError',
      message: `関数'${name}'は${want}個の引数を取りますが、渡されたのは${got}個です`,
    },
  }
}

function undefinedFunctionError(name) {
  return {
    error: {
      type: 'UndefinedFunctionError',
      message: `関数'${name}'は存在しません`,
    },
  }
}

// if文の評価をする
function evaluateIfStatement(ast, initialEnvironment) {
  const { condition, statements } = ast
  // eslint-disable-next-line no-use-before-define
  const { result, error, environment: halfwayEnvironment } = evaluate(condition, initialEnvironment)
  if (error) {
    return {
      error,
      environment: halfwayEnvironment,
    }
  }
  if ((result.type === 'BoolValue' && result.value === false) || result.type === 'NullValue') {
    return {
      result: nullValue,
      environment: halfwayEnvironment,
    }
  }
  // eslint-disable-next-line no-use-before-define
  return evaluateMultiAST(statements, halfwayEnvironment)
}

// 足し算の評価をする
function evaluateAdd(ast, environment) {
  const {
    result: leftResult,
    error: leftError,
    environment: leftEnvironment,
    // eslint-disable-next-line no-use-before-define
  } = evaluate(ast.left, environment)
  if (leftError) {
    return { error: leftError }
  }
  if (leftResult.type !== 'IntValue') {
    return typeError(leftResult.type)
  }
  const {
    result: rightResult,
    error: rightError,
    environment: rightEnvironment,
    // eslint-disable-next-line no-use-before-define
  } = evaluate(ast.right, leftEnvironment)
  if (rightError) {
    return { error: rightError }
  }
  if (rightResult.type !== 'IntValue') {
    return typeError(rightResult.type)
  }
  return {
    result: intValue(leftResult.value + rightResult.value),
    environment: rightEnvironment,
  }
}

// JSの組み込み関数を呼び出すために、インタプリタ内で使うオブジェクトをJSのオブジェクトに変換する
function unwrapObject(obj) {
  switch (obj.type) {
    case 'IntValue':
    case 'BoolValue':
      return obj.value
    case 'NullValue':
      return null
    default:
      return null
  }
}

// JSの組み込み関数で得られた結果をインタプリタ内で使うオブジェクトに変換する
function wrapObject(obj) {
  const toStr = Object.prototype.toString
  switch (toStr.call(obj)) {
    case '[object Number]':
      return intValue(obj)
    case '[object Boolean]':
      return boolValue(obj)
    default:
      return nullValue
  }
}

// 組み込み関数を呼び出す
function evaluateEmbeddedFunction(func, args) {
  return {
    result: wrapObject(func.function(...args.map(unwrapObject))),
  }
}

// 自作した言語の中で定義した関数を呼び出す
function evaluateDefinedFunction(func, args, env) {
  // eslint-disable-next-line no-use-before-define
  return evaluateMultiAST(func.statements, {
    variables: new Map(
      [...Array(func.argumentsCount).keys()]
        .map((i) => [func.arguments[i], { value: args[i] }]),
    ),
    functions: env.functions,
  })
}

// 組み込み関数か定義した関数かで分けて、適切に呼び出す
function computeFunction(func, name, args, env) {
  switch (func.type) {
    case 'EmbeddedFunction':
      return evaluateEmbeddedFunction(func, args)
    case 'DefinedFunction':
      return evaluateDefinedFunction(func, args, env)
    default:
      return {
        error: {
          type: 'FunctionTypeError',
          message: `関数'${name}'の型が無効な型'${func.type}'です`,
        },
      }
  }
}

// 関数呼び出しの引数をそれぞれ評価する
function evaluateArguments(args, environment) {
  const evaluatedArguments = []
  let argumentsEvaluatedEnvironment = environment
  // eslint-disable-next-line no-restricted-syntax
  for (const stmt of args) {
    const {
      result: argResult, error: argError, environment: argEnvironment,
    // eslint-disable-next-line no-use-before-define
    } = evaluate(stmt, argumentsEvaluatedEnvironment)
    if (argError) {
      return { error: argError }
    }
    evaluatedArguments.push(argResult)
    argumentsEvaluatedEnvironment = argEnvironment
  }

  return {
    evaluatedArguments,
    environment: argumentsEvaluatedEnvironment,
  }
}

// 関数呼び出しを評価する
function evaluateFunctionCalling(calling, environment) {
  const func = environment.functions.get(calling.name)
  if (func === undefined) {
    return undefinedFunctionError(calling.name)
  }
  const args = calling.arguments
  if (func.argumentsCount !== args.length) {
    return argumentsCountError(calling.name, func.argumentsCount, calling.arguments.length)
  }
  const {
    error: evaluatingArgumentsError,
    evaluatedArguments,
    environment: argumentsEvaluatedEnvironment,
  } = evaluateArguments(args, environment)
  if (evaluatingArgumentsError) {
    return { error: evaluatingArgumentsError }
  }
  const { result, error: computingFunctionError } = computeFunction(
    func, calling.name, evaluatedArguments, argumentsEvaluatedEnvironment,
  )
  if (computingFunctionError) {
    return { error: computingFunctionError }
  }
  return {
    result,
    environment: argumentsEvaluatedEnvironment,
  }
}

// 関数定義を評価する
function evaluateFunctionDefinition(funcDef, environment) {
  return {
    result: nullValue,
    environment: {
      variables: environment.variables,
      functions: new Map(environment.functions).set(
        funcDef.name,
        {
          type: 'DefinedFunction',
          argumentsCount: funcDef.arguments.length,
          arguments: funcDef.arguments,
          statements: funcDef.statements,
        },
      ),
    },
  }
}

// 複数の抽象構文木を、前から順番に評価していく
function evaluateMultiAST(partsOfSource, environment) {
  let result = nullValue
  let env = environment
  // forEachではreturnを使って値を返せないので書きづらく、
  // またreduceでは条件分岐が複雑になり書きづらいので、for文を使って処理しています
  // eslint-disable-next-line no-restricted-syntax
  for (const part of partsOfSource) {
    const {
      result: evaluatedResult,
      error: evaluatingError,
      environment: evaluatedEnvironment,
      // eslint-disable-next-line no-use-before-define
    } = evaluate(part, env)
    if (evaluatingError) {
      return { error: evaluatingError }
    }
    result = evaluatedResult
    env = evaluatedEnvironment
  }
  return { result, environment: env }
}

// 抽象構文木を評価する
function evaluate(ast, environment) {
  switch (ast.type) {
    case 'Source':
      return evaluateMultiAST(ast.partsOfSource, environment)
    case 'FuncDef':
      return evaluateFunctionDefinition(ast, environment)
    case 'Assignment':
      return {
        result: nullValue,
        environment: {
          variables: new Map(environment.variables).set(
            ast.name,
            { value: evaluate(ast.expression, environment).result },
          ),
          functions: environment.functions,
        },
      }
    case 'If':
      return evaluateIfStatement(ast, environment)
    case 'Add':
      return evaluateAdd(ast, environment)
    case 'Variable':
      return {
        result: environment.variables.get(ast.name)?.value || nullValue,
        environment,
      }
    case 'FuncCall':
      return evaluateFunctionCalling(ast, environment)
    case 'IntLiteral':
      return {
        result: intValue(ast.value),
        environment,
      }
    case 'BoolLiteral':
      return {
        result: boolValue(ast.value),
        environment,
      }
    case 'NullLiteral':
      return {
        result: nullValue,
        environment,
      }
    default:
      return evaluatorError(ast, environment)
  }
}

exports.evaluate = evaluate
