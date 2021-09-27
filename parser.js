function parseLiteral(tokens) {
  const head = tokens[0]
  switch (head.type) {
    case 'Int':
      return {
        expression: {
          type: 'IntLiteral',
          value: head.value,
        },
        parsedTokensCount: 1,
      }
    default:
      return {
        expression: null,
      }
  }
}

function parseAddSubExpression(tokens) {
  let { expression: left, parsedTokensCount: readPosition } = parseLiteral(tokens)
  while (tokens[readPosition] && tokens[readPosition].type === 'Plus') {
    const {
      expression: right,
      parsedTokensCount: rightTokensCount,
    } = parseLiteral(tokens.slice(readPosition + 1))
    left = { type: 'Add', left, right }
    readPosition += rightTokensCount + 1
  }
  return { expression: left, parsedTokensCount: readPosition }
}

function parseExression(tokens) {
  return parseAddSubExpression(tokens)
}

function parseSource(tokens) {
  const statements = []
  let readPosition = 0
  while (readPosition < tokens.length) {
    const { expression, parsedTokensCount } = parseExression(tokens.slice(readPosition))
    if (expression) {
      statements.push(expression)
      readPosition += parsedTokensCount
    } else if (tokens[readPosition].type === 'Newline') {
      readPosition += 1
    } else {
      return {
        type: 'SyntaxError',
        message: `予期しないトークン\`${tokens[readPosition].type}\`が渡されました`,
        statements,
      }
    }
  }
  return {
    type: 'Source',
    statements,
  }
}

module.exports.parse = parseSource
