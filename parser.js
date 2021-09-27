function parseLiteral(tokens) {
  const head = tokens[0]
  switch (head?.type) {
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

function parseValue(tokens) {
  const head = tokens[0]
  if (head?.type === 'Ident') {
    return {
      expression: {
        type: 'Variable',
        name: head.value,
      },
      parsedTokensCount: 1,
    }
  }
  return parseLiteral(tokens)
}

function parseParenthesisExpression(tokens) {
  if (tokens[0]?.type === 'LParen') {
    // eslint-disable-next-line no-use-before-define
    const { expression, parsedTokensCount } = parseExression(tokens.slice(1))
    if (tokens[parsedTokensCount + 1]?.type === 'RParen') {
      return { expression, parsedTokensCount: parsedTokensCount + 2 }
    }
  }
  return parseValue(tokens)
}

function parseFunctionCallExpression(tokens) {
  const name = tokens[0]
  if (name?.type === 'Ident' && tokens[1]?.type === 'LParen') {
    const {
      expression: firstExpression,
      parsedTokensCount: firstParsedTokensCount,
    // eslint-disable-next-line no-use-before-define
    } = parseExression(tokens.slice(2))
    if (firstExpression === null && tokens[2]?.type === 'RParen') {
      return {
        expression: {
          type: 'FuncCall',
          name: name.value,
          arguments: [],
        },
        parsedTokensCount: 3,
      }
    }
    if (tokens[firstParsedTokensCount + 2]?.type === 'RParen') {
      return {
        expression: {
          type: 'FuncCall',
          name: name.value,
          arguments: [firstExpression],
        },
        parsedTokensCount: firstParsedTokensCount + 3,
      }
    }
    const args = [firstExpression]
    let readPosition = firstParsedTokensCount + 2
    while (tokens[readPosition]?.type === 'Comma') {
      readPosition += 1
      // eslint-disable-next-line no-use-before-define
      const { expression, parsedTokensCount } = parseExression(tokens.slice(readPosition))
      if (expression === null) {
        break
      }
      args.push(expression)
      readPosition += parsedTokensCount
      if (tokens[readPosition]?.type === 'RParen') {
        return {
          expression: {
            type: 'FuncCall',
            name: name.value,
            arguments: args,
          },
        }
      }
    }
  }
  return parseParenthesisExpression(tokens)
}

function parseAddSubExpression(tokens) {
  let { expression: left, parsedTokensCount: readPosition } = parseFunctionCallExpression(tokens)
  while (tokens[readPosition]?.type === 'Plus') {
    const {
      expression: right,
      parsedTokensCount: rightTokensCount,
    } = parseFunctionCallExpression(tokens.slice(readPosition + 1))
    if (right === null) {
      return { expression: null }
    }
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
