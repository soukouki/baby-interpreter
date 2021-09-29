const { intValue, nullValue, boolBalue } = require('./value')

function evaluaterError(type, environment) {
  return {
    result: {
      type: 'EvaluatorError',
      isError: true,
      message: `無効なast\`${type}\`が渡されました`,
    },
    environment,
  }
}

function typeError(type, environment) {
  return {
    result: {
      type: 'TypeError',
      isError: true,
      message: `無効な型\`${type}\`が渡されました`,
    },
    environment,
  }
}

function evaluateStatements(statements, environment) {
  let result = nullValue
  let env = environment
  // forEachではreturnを使って値を返せないので書きづらく、
  // またreduceでは条件分岐が複雑になり書きづらいので、for文を使って処理しています
  // eslint-disable-next-line no-restricted-syntax
  for (const stmt of statements) {
    // eslint-disable-next-line no-use-before-define
    const evalResult = evaluate(stmt, env)
    if (evalResult === null) {
      return evaluaterError(stmt, env)
    }
    result = evalResult.result
    env = evalResult.environment
  }
  return { result, environment: env }
}

function evaluateIfStatement(ast, initialEnvironment) {
  const { condition, statements } = ast
  // eslint-disable-next-line no-use-before-define
  const evalResult = evaluate(condition, initialEnvironment)
  if (evalResult === null) {
    return evaluaterError(condition, initialEnvironment)
  }
  const { result, environment: halfwayEnvironment } = evalResult
  if ((result.type === 'BoolValue' && result.value === false) || result.type === 'NullValue') {
    return {
      result: nullValue,
      environment: halfwayEnvironment,
    }
  }
  // eslint-disable-next-line no-use-before-define
  return evaluateStatements(statements, halfwayEnvironment)
}

function evaluateAdd(ast, environment) {
  const {
    result: leftResult,
    environment: leftEnvironment,
    // eslint-disable-next-line no-use-before-define
  } = evaluate(ast.left, environment)
  if (leftResult.isError) {
    return { result: leftResult, environment: leftEnvironment }
  }
  if (leftResult.type !== 'IntValue') {
    return typeError(leftResult.type)
  }
  const {
    result: rightResult,
    environment: rightEnvironment,
  // eslint-disable-next-line no-use-before-define
  } = evaluate(ast.right, leftEnvironment)
  if (rightResult.isError) {
    return { result: rightResult, environment: rightEnvironment }
  }
  if (rightResult.type !== 'IntValue') {
    return typeError(rightResult.type)
  }
  return {
    result: intValue(leftResult.value + rightResult.value),
    environment: rightEnvironment,
  }
}

function evaluate(ast, environment) {
  switch (ast.type) {
    case 'Source':
      return evaluateStatements(ast.statements, environment)
    case 'Assignment':
      return {
        result: nullValue,
        environment: {
          variables: new Map(environment.variables).set(
            ast.name,
            evaluate(ast.expression, environment).result,
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
        result: environment.variables.get(ast.name) || nullValue,
        environment,
      }
    case 'IntLiteral':
      return {
        result: intValue(ast.value),
        environment,
      }
    case 'BoolLiteral':
      return {
        result: boolBalue(ast.value),
        environment,
      }
    case 'NullLiteral':
      return {
        result: nullValue,
        environment,
      }
    default:
      return evaluaterError(ast.type, environment)
  }
}

exports.evaluate = evaluate
