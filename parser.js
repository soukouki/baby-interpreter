// リテラルの構文解析
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

// 変数参照の構文解析
function parseValue(tokens) {
  const head = tokens[0]
  if (head?.type === 'Ident') {
    return {
      expression: {
        type: 'Variable',
        name: head.name,
      },
      parsedTokensCount: 1,
    }
  }
  return parseLiteral(tokens)
}

// 優先順位を変える丸括弧の構文解析
function parseParenthesesExpression(tokens) {
  if (tokens[0]?.type === 'LParen') {
    // eslint-disable-next-line no-use-before-define
    const { expression, parsedTokensCount } = parseExpression(tokens.slice(1))
    if (tokens[parsedTokensCount + 1]?.type === 'RParen') {
      return { expression, parsedTokensCount: parsedTokensCount + 2 }
    }
  }
  return parseValue(tokens)
}

// コンマで区切られた式(例えば引数リスト)の構文解析
// `aaa, b+c` のようなものを解析する
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

// 関数呼び出しの構文解析
// `func(arg1, arg2)` のようなものを解析する
function parseFunctionCallingExpression(tokens) {
  const name = tokens[0]
  if (name?.type !== 'Ident' || tokens[1]?.type !== 'LParen') {
    return parseParenthesesExpression(tokens)
  }
  const argsAndParsedTokensCount = parseCommaSeparatedExpressions(tokens.slice(2))
  if (argsAndParsedTokensCount === null) {
    return parseParenthesesExpression(tokens)
  }
  const { args, parsedTokensCount } = argsAndParsedTokensCount
  if (tokens[parsedTokensCount + 2]?.type !== 'RParen') {
    return parseParenthesesExpression(tokens)
  }
  return {
    expression: {
      type: 'FuncCall',
      name: name.name,
      arguments: args,
    },
    parsedTokensCount: parsedTokensCount + 3,
  }
}

// 足し算と引き算の構文解析
// 引き算は勉強会中で機能追加をする
function parseAddSubExpression(tokens) {
  let { expression: left, parsedTokensCount: readPosition } = parseFunctionCallingExpression(tokens)
  while (tokens[readPosition]?.type === 'Plus') {
    const {
      expression: right,
      parsedTokensCount: rightTokensCount,
    } = parseFunctionCallingExpression(tokens.slice(readPosition + 1))
    if (right === null) {
      return { expression: null }
    }
    left = { type: 'Add', left, right }
    readPosition += rightTokensCount + 1
  }
  return { expression: left, parsedTokensCount: readPosition }
}

// 式の構文解析であることをわかりやすくするための関数
// 足し算引き算よりも優先順位の低い式の構文を作ったときに書き換える
function parseExpression(tokens) {
  return parseAddSubExpression(tokens)
}

// 波括弧で囲まれたブロックの構文解析
// `{ stmt1; stmt2; }` のようなものを解析する
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
    parsedTokensCount: readPosition + 1,
  }
}

// if文の構文解析
// `if(cond) { stmt1; stmt2; }` のようなものを解析する
function parseIfStatement(tokens) {
  if (tokens[0]?.type !== 'If' || tokens[1]?.type !== 'LParen') {
    return { ifStatement: null }
  }
  const {
    expression: condition,
    parsedTokensCount: parsedConditionTokensCount,
  } = parseExpression(tokens.slice(2))
  if (
    !condition
    || tokens[parsedConditionTokensCount + 2]?.type !== 'RParen') {
    return { ifStatement: null }
  }
  const {
    statements,
    parsedTokensCount: parsedBlockTokensCount,
  } = parseBlock(tokens.slice(parsedConditionTokensCount + 3))
  if (!statements) {
    return { ifStatement: null }
  }
  return {
    ifStatement: {
      type: 'If',
      condition,
      statements,
    },
    parsedTokensCount: parsedConditionTokensCount + parsedBlockTokensCount + 3,
  }
}

// 代入文の構文解析
// `ident = 12+34;` のようなものを解析する
// この段階ではセミコロンは含まない
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
      name: tokens[0].name,
      expression,
    },
    parsedTokensCount: parsedTokensCount + 2,
  }
}

// 文の構文解析
// 式(式文), 代入文, if文が文
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

// カンマで区切られた識別子の構文解析
// `x, y, z` のようなものを解析する
function parseCommaSeparatedIdentfiers(tokens) {
  const head = tokens[0]
  if (head?.type !== 'Ident') {
    return {
      names: [],
      parsedTokensCount: 0,
    }
  }
  const names = [head.name]
  let readPosition = 1
  while (tokens[readPosition]?.type === 'Comma') {
    readPosition += 1
    // eslint-disable-next-line no-use-before-define
    const next = tokens[readPosition]
    if (next.type !== 'Ident') {
      break
    }
    names.push(next.name)
    readPosition += 1
  }
  return {
    names,
    parsedTokensCount: readPosition,
  }
}

// 関数定義の構文解析
// `def func(x, y) { stmt1; stmt2; }` のようなものを解析する
function parseFunctionDefinition(tokens) {
  if (tokens[0]?.type !== 'Def' || tokens[1]?.type !== 'Ident' || tokens[2]?.type !== 'LParen') {
    return { define: null }
  }
  const { name } = tokens[1]
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

// ソースコード全体の構文解析
function parseSource(tokens) {
  const partsOfSource = []
  let readPosition = 0
  while (readPosition < tokens.length) {
    const {
      statement: stmt,
      parsedTokensCount: parsedExpressionTokensCount,
    } = parseStatement(tokens.slice(readPosition))
    if (stmt) {
      partsOfSource.push(stmt)
      readPosition += parsedExpressionTokensCount
      continue
    }
    const {
      defineFunction,
      parsedTokensCount: parsedDefineFunctionTokensCount,
    } = parseFunctionDefinition(tokens.slice(readPosition))
    if (defineFunction) {
      partsOfSource.push(defineFunction)
      readPosition += parsedDefineFunctionTokensCount
      continue
    }
    return {
      type: 'SyntaxError',
      message: `予期しないトークン'${tokens[readPosition]?.type}'が渡されました`,
      headToken: tokens[readPosition],
    }
  }
  return {
    type: 'Source',
    partsOfSource,
  }
}

module.exports.parse = parseSource
