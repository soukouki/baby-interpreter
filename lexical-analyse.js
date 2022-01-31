function isDigit(char) {
  const charCode = char.charCodeAt(0)
  return '0'.charCodeAt(0) <= charCode && charCode <= '9'.charCodeAt(0)
}

function isIdentChar(char) {
  const charCode = char.charCodeAt(0)
  return ('a'.charCodeAt(0) <= charCode && charCode <= 'z'.charCodeAt(0)) || ('A'.charCodeAt(0) <= charCode && charCode <= 'Z'.charCodeAt(0)) || charCode === '_'.charCodeAt(0) || ('ぁ'.charCodeAt(0) <= charCode && charCode <= 'ん'.charCodeAt(0))
}

function countDigits(source) {
  let readPosition = 0
  while (readPosition < source.length) {
    if (!isDigit(source[readPosition])) {
      return readPosition
    }
    readPosition += 1
  }
  return readPosition
}

function countIdentChars(source) {
  let readPosition = 0
  while (readPosition < source.length) {
    if (!isIdentChar(source[readPosition])) {
      return readPosition
    }
    readPosition += 1
  }
  return readPosition
}

function countLiteral(source) {
  let readPosition = 0
  while (readPosition < source.length) {
    if (source[readPosition - 1] !== '\\' && source[readPosition] === '"') {
      break
    }
    readPosition += 1
  }
  return readPosition
}

function escapeSeqLiteral(source) {
  let readPosition = 0
  let literal
  while (1) {
    if (source[readPosition] === '\\') {
      if (source[readPosition + 1] === 'n') {
        literal = `${literal + source.substr(0, readPosition)}\n`
        source = source.slice(readPosition + 2)
        readPosition = 0
      } else if (source[readPosition + 1] === 't') {
        literal = `${literal + source.substr(0, readPosition)}\t`
        source = source.slice(readPosition + 2)
        readPosition = 0
      } else if (source[readPosition + 1] === '"') {
        literal = `${literal + source.substr(0, readPosition)}\"`
        source = source.slice(readPosition + 2)
        readPosition = 0
      }
    }
    if (readPosition >= source.length - 1) {
      literal += source
      break
    }
    readPosition += 1
  }
  return literal.substr(9, literal.length)
}

module.exports.lexicalAnalyse = function (source) {
  const tokens = []
  let readPosition = 0
  while (readPosition < source.length) {
    switch (source[readPosition]) {
      case '=':
        if (source[readPosition + 1] === '=') {
          tokens.push({ type: 'EqualEqual' })
          readPosition += 2
        } else {
          tokens.push({ type: 'Equal' })
          readPosition += 1
        }
        break
      case '!':
        if (source[readPosition + 1] === '=') {
          tokens.push({ type: 'ExclaEqual' })
          readPosition += 2
        } else {
          tokens.push({ type: 'Excla' })
          readPosition += 1
        }
        break
      case '<':
        if (source[readPosition + 1] === '=') {
          tokens.push({ type: 'LesserEqual' })
          readPosition += 2
        } else {
          tokens.push({ type: 'Lesser' })
          readPosition += 1
        }
        break
      case '>':
        if (source[readPosition + 1] === '=') {
          tokens.push({ type: 'GreaterEqual' })
          readPosition += 2
        } else {
          tokens.push({ type: 'Greater' })
          readPosition += 1
        }
        break
      case '+':
        tokens.push({ type: 'Plus' })
        readPosition += 1
        break
      case '-':
        tokens.push({ type: 'Minus' })
        readPosition += 1
        break
      case '*':
        tokens.push({ type: 'Asterisk' })
        readPosition += 1
        break
      case '/':
        if (source[readPosition + 1] === '/') {
          readPosition += 2
          while (readPosition < source.length) {
            readPosition += 1
          }
        } else if (source[readPosition + 1] === '*') {
          readPosition += 2
          while (1) {
            if (source[readPosition] === '*' && source[readPosition + 1] === '/') {
              readPosition += 2
              break
            }
            readPosition += 1
          }
        } else {
          tokens.push({ type: 'Slash' })
          readPosition += 1
        }
        break
      case '(':
        tokens.push({ type: 'LParen' })
        readPosition += 1
        break
      case ')':
        tokens.push({ type: 'RParen' })
        readPosition += 1
        break
      case '{':
        tokens.push({ type: 'LBrace' })
        readPosition += 1
        break
      case '}':
        tokens.push({ type: 'RBrace' })
        readPosition += 1
        break
      case ',':
        tokens.push({ type: 'Comma' })
        readPosition += 1
        break
      case ';':
        tokens.push({ type: 'Semicolon' })
        readPosition += 1
        break
      case '"':
        readPosition += 1
        const literalCount = countLiteral(source.slice(readPosition))
        const string = escapeSeqLiteral(source.slice(readPosition, readPosition + literalCount))
        tokens.push({ type: 'String', value: string })
        readPosition += literalCount + 1
        break
      case ' ':
      case '\t':
      case '\n':
        readPosition += 1
        break
      default:
        if (isDigit(source[readPosition])) {
          const digitsCount = countDigits(source.slice(readPosition))
          tokens.push({
            type: 'Int',
            value: parseInt(source.slice(readPosition, readPosition + digitsCount), 10),
          })
          readPosition += digitsCount
        } else if (isIdentChar(source[readPosition])) {
          const identCharsCount = countIdentChars(source.slice(readPosition))
          const name = source.slice(readPosition, readPosition + identCharsCount)
          switch (name) {
            case 'if':
              tokens.push({
                type: 'If',
              })
              break
            case 'else':
              tokens.push({
                type: 'Else',
              })
              break
            case 'while':
              tokens.push({
                type: 'While',
              })
              break
            case 'def':
              tokens.push({
                type: 'Def',
              })
              break
            case 'break':
              tokens.push({
                type: 'Break',
              })
            case 'true':
            case 'false':
              tokens.push({
                type: 'Bool',
                value: name === 'true',
              })
              break
            case 'null':
              tokens.push({
                type: 'Null',
              })
              break
            default:
              tokens.push({
                type: 'Ident',
                name,
              })
          }
          readPosition += identCharsCount
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
