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
    case 'Bool':
      return {
        expression: {
          type: 'BoolLiteral',
          value: head.value,
        },
        parsedTokensCount: 1,
      }
    case 'Null':
      return {
        expression: {
          type: 'NullLiteral',
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
    const { expression, parsedTokensCount } = parseExpression(tokens.slice(1))
    if (tokens[parsedTokensCount + 1]?.type === 'RParen') {
      return { expression, parsedTokensCount: parsedTokensCount + 2 }
    }
  }
  return parseValue(tokens)
}

function parseCommaSeparatedExpressions(tokens) {
  const {
    expression: firstExpression,
    parsedTokensCount: firstParsedTokensCount,
  // eslint-disable-next-line no-use-before-define
  } = parseExpression(tokens)
  if (firstExpression === null) {
    return {
      args: [],
      parsedTokensCount: 0,
    }
  }
  const args = [firstExpression]
  let readPosition = firstParsedTokensCount
  while (tokens[readPosition]?.type === 'Comma') {
    readPosition += 1
    // eslint-disable-next-line no-use-before-define
    const { expression, parsedTokensCount } = parseExpression(tokens.slice(readPosition))
    if (expression === null) {
      return null
    }
    args.push(expression)
    readPosition += parsedTokensCount
  }
  return {
    args,
    parsedTokensCount: readPosition,
  }
}

function parseFunctionCallExpression(tokens) {
  const name = tokens[0]
  if (name?.type !== 'Ident' || tokens[1]?.type !== 'LParen') {
    return parseParenthesisExpression(tokens)
  }
  const argsAndParsedTokensCount = parseCommaSeparatedExpressions(tokens.slice(2))
  if (argsAndParsedTokensCount === null) {
    return parseParenthesisExpression(tokens)
  }
  const { args, parsedTokensCount } = argsAndParsedTokensCount
  if (tokens[parsedTokensCount + 2]?.type !== 'RParen') {
    return parseParenthesisExpression(tokens)
  }
  return {
    expression: {
      type: 'FuncCall',
      name: name.value,
      arguments: args,
    },
    parsedTokensCount: parsedTokensCount + 3,
  }
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

function parseExpression(tokens) {
  return parseAddSubExpression(tokens)
}

function parseBlock(tokens) {
  if (tokens[0]?.type !== 'LBrace') {
    return { statements: null }
  }
  const statements = []
  let readPosition = 1
  while (tokens[readPosition]?.type !== 'RBrace') {
    if (tokens[readPosition] === undefined) {
      return { statements: null }
    }
    const {
      statement: stmt,
      parsedTokensCount,
    // eslint-disable-next-line no-use-before-define
    } = parseStatement(tokens.slice(readPosition))
    if (stmt === null) {
      return { statements: null }
    }
    statements.push(stmt)
    readPosition += parsedTokensCount
  }
  return {
    statements,
    parsedTokensCount: readPosition + 2,
  }
}

function parseIfStatement(tokens) {
  if (tokens[0]?.type !== 'If' || tokens[1]?.type !== 'LParen') {
    return { ifStatement: null }
  }
  const {
    expression: condition,
    parsedTokensCount: parsedExpressionTokensCount,
  } = parseExpression(tokens.slice(2))
  if (
    !condition
    || tokens[parsedExpressionTokensCount + 2]?.type !== 'RParen') {
    return { ifStatement: null }
  }
  const {
    statements,
    parsedTokensCount: parsedBlockTokensCount,
  } = parseBlock(tokens.slice(parsedExpressionTokensCount + 3))
  if (!statements) {
    return { ifStatement: null }
  }
  return {
    ifStatement: {
      type: 'If',
      condition,
      statements,
    },
    parsedTokensCount: parsedExpressionTokensCount + parsedBlockTokensCount + 3,
  }
}

function parseAssignment(tokens) {
  if (tokens[0]?.type !== 'Ident' || tokens[1]?.type !== 'Equal') {
    return { assignment: null }
  }
  const { expression, parsedTokensCount } = parseExpression(tokens.slice(2))
  if (!expression) {
    return { assignment: null }
  }
  return {
    assignment: {
      type: 'Assignment',
      name: tokens[0].value,
      expression,
    },
    parsedTokensCount: parsedTokensCount + 2,
  }
}

function parseStatement(tokens) {
  const { expression, parsedTokensCount: parsedExpressionTokensCount } = parseExpression(tokens)
  if (expression && tokens[parsedExpressionTokensCount]?.type === 'Semicolon') {
    return {
      statement: expression,
      parsedTokensCount: parsedExpressionTokensCount + 1,
    }
  }
  const { assignment, parsedTokensCount: parsedAssignmentTokensCount } = parseAssignment(tokens)
  if (assignment && tokens[parsedAssignmentTokensCount]?.type === 'Semicolon') {
    return {
      statement: assignment,
      parsedTokensCount: parsedAssignmentTokensCount + 1,
    }
  }
  const { ifStatement, parsedTokensCount: parsedIfTokensCount } = parseIfStatement(tokens)
  if (ifStatement) {
    return {
      statement: ifStatement,
      parsedTokensCount: parsedIfTokensCount,
    }
  }
  return { statement: null }
}

function parseCommaSeparatedIdentfiers(tokens) {
  const head = tokens[0]
  if (head?.type !== 'Ident') {
    return {
      names: [],
      parsedTokensCount: 0,
    }
  }
  const names = [head.value]
  let readPosition = 1
  while (tokens[readPosition]?.type === 'Comma') {
    readPosition += 1
    // eslint-disable-next-line no-use-before-define
    const next = tokens[readPosition]
    if (next.type !== 'Ident') {
      break
    }
    names.push(next.value)
    readPosition += 1
  }
  return {
    names,
    parsedTokensCount: readPosition,
  }
}

function parseDefineFunction(tokens) {
  if (tokens[0]?.type !== 'Def' || tokens[1]?.type !== 'Ident' || tokens[2]?.type !== 'LParen') {
    return { define: null }
  }
  const { value: name } = tokens[1]
  const {
    names: args,
    parsedTokensCount: parsedArgumentTokensCount,
  } = parseCommaSeparatedIdentfiers(tokens.slice(3))
  if (tokens[parsedArgumentTokensCount + 3]?.type !== 'RParen') {
    return { define: null }
  }
  const {
    statements,
    parsedTokensCount: parsedBlockTokensCount,
  } = parseBlock(tokens.slice(parsedArgumentTokensCount + 4))
  if (!statements) {
    return { define: null }
  }
  return {
    defineFunction: {
      type: 'FuncDef',
      name,
      arguments: args,
      statements,
    },
    parsedTokensCount: parsedArgumentTokensCount + parsedBlockTokensCount + 4,
  }
}

function parseSource(tokens) {
  const statements = []
  let readPosition = 0
  while (readPosition < tokens.length) {
    const {
      statement: stmt,
      parsedTokensCount: parsedExpressionTokensCount,
    } = parseStatement(tokens.slice(readPosition))
    if (stmt) {
      statements.push(stmt)
      readPosition += parsedExpressionTokensCount
      // eslint-disable-next-line no-continue
      continue
    }
    const {
      defineFunction,
      parsedTokensCount: parsedDefineFunctionTokensCount,
    } = parseDefineFunction(tokens.slice(readPosition))
    if (defineFunction) {
      statements.push(defineFunction)
      readPosition += parsedDefineFunctionTokensCount
      // eslint-disable-next-line no-continue
      continue
    }
    return {
      type: 'SyntaxError',
      message: `予期しないトークン\`${tokens[readPosition]?.type}\`が渡されました`,
      headToken: tokens[readPosition],
    }
  }
  return {
    type: 'Source',
    statements,
  }
}

module.exports.parse = parseSource
