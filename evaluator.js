const Value = require('./value')

function environmentError(type, environment) {
  return {
    result: {
      type: 'EnviromentError',
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

function evaluateStatements(ast, environment) {
  let result = Value.null
  let env = environment
  // forEachではreturnを使って値を返せないので書きづらく、
  // またreduceでは条件分岐が複雑になり書きづらいので、for文を使って処理しています
  // eslint-disable-next-line no-restricted-syntax
  for (const stmt of ast.statements) {
    // eslint-disable-next-line no-use-before-define
    const evalResult = evaluate(stmt, env)
    if (evalResult === null) {
      return environmentError(stmt, env)
    }
    result = evalResult.result
    env = evalResult.environment
  }
  return { result, environment: env }
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
    result: Value.intValue(leftResult.value + rightResult.value),
    environment: rightEnvironment,
  }
}

function evaluate(ast, environment) {
  switch (ast.type) {
    case 'Source':
      return evaluateStatements(ast, environment)
    case 'Add':
      return evaluateAdd(ast, environment)
    case 'IntLiteral':
      return {
        result: Value.intValue(ast.value),
        environment,
      }
    default:
      return environmentError(ast.type, environment)
  }
}

exports.evaluate = evaluate
