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

function evaluate(ast, environment) {
  switch (ast.type) {
    case 'Source':
      return evaluateStatements(ast, environment)
    case 'IntLiteral':
      return {
        result: {
          type: 'IntValue',
          isError: false,
          value: ast.value,
        },
        environment,
      }
    default:
      return environmentError(ast.type, environment)
  }
}

exports.evaluate = evaluate
