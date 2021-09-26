function isDigit(char) {
  const charCode = char.charCodeAt(0)
  return '0'.charCodeAt(0) <= charCode && charCode <= '9'.charCodeAt(0)
}

function countDigitsFromSource(source) {
  let readPosition = 0
  while (readPosition < source.length) {
    if (!isDigit(source[readPosition])) {
      return readPosition
    }
    readPosition += 1
  }
  return readPosition
}

module.exports.lexicalAnalyse = function (source) {
  const tokens = []
  let readPosition = 0
  while (readPosition < source.length) {
    switch (source[readPosition]) {
      case ' ':
      case '\t':
        readPosition += 1
        break
      case '+':
        tokens.push({
          type: 'Plus',
        })
        readPosition += 1
        break
      case '\n':
        tokens.push({
          type: 'Newline',
        })
        readPosition += 1
        break
      default:
        if (isDigit(source[readPosition])) {
          const digitsCount = countDigitsFromSource(source.substring(readPosition))
          tokens.push({
            type: 'Int',
            value: parseInt(source.substring(readPosition, readPosition + digitsCount), 10),
          })
          readPosition += digitsCount
        } else {
          // 不明な文字
          tokens.push({
            type: 'UnknownCharacter',
            value: source[readPosition],
          })
          readPosition += 1
        }
    }
  }
  return tokens
}

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
  const { expression: left, parsedTokensCount: leftTokensCount } = parseLiteral(tokens)
  if (tokens[leftTokensCount] && tokens[leftTokensCount].type === 'Plus') {
    const {
      expression: right,
      parsedTokensCount: rightTokensCount,
    } = parseLiteral(tokens.slice(leftTokensCount + 1))
    return {
      expression: { type: 'Add', left, right },
      parsedTokensCount: leftTokensCount + rightTokensCount + 1,
    }
  }
  return { expression: left, parsedTokensCount: leftTokensCount }
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
