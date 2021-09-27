function isDigit(char) {
  const charCode = char.charCodeAt(0)
  return '0'.charCodeAt(0) <= charCode && charCode <= '9'.charCodeAt(0)
}

function isIdentChar(char) {
  const charCode = char.charCodeAt(0)
  return 'a'.charCodeAt(0) <= charCode && charCode <= 'z'.charCodeAt(0)
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

module.exports.lexicalAnalyse = function (source) {
  const tokens = []
  let readPosition = 0
  while (readPosition < source.length) {
    switch (source[readPosition]) {
      case '+':
        tokens.push({ type: 'Plus' })
        readPosition += 1
        break
      case '(':
        tokens.push({ type: 'LParen' })
        readPosition += 1
        break
      case ')':
        tokens.push({ type: 'RParen' })
        readPosition += 1
        break
      case ',':
        tokens.push({ type: 'Comma' })
        readPosition += 1
        break
      case ' ':
      case '\t':
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
          const digitsCount = countDigits(source.substring(readPosition))
          tokens.push({
            type: 'Int',
            value: parseInt(source.substring(readPosition, readPosition + digitsCount), 10),
          })
          readPosition += digitsCount
        } else if (isIdentChar(source[readPosition])) {
          const identCharsCount = countIdentChars(source.substring(readPosition))
          tokens.push({
            type: 'Ident',
            value: source.substring(readPosition, readPosition + identCharsCount),
          })
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
