const { lexicalAnalyse } = require('./lexical-analyse')

describe('字句解析', () => {
  test('空文字列', () => {
    expect(lexicalAnalyse('')).toStrictEqual([])
  })
  test('1', () => {
    expect(lexicalAnalyse('1')).toStrictEqual([{ type: 'Int', value: 1 }])
  })
  test('123', () => {
    expect(lexicalAnalyse('123')).toStrictEqual([{ type: 'Int', value: 123 }])
  })
  test('+', () => {
    expect(lexicalAnalyse('+')).toStrictEqual([{ type: 'Plus' }])
  })
  test('=', () => {
    expect(lexicalAnalyse('=')).toStrictEqual([{ type: 'Equal' }])
  })
  test('1+2', () => {
    expect(lexicalAnalyse('1+2')).toStrictEqual([
      { type: 'Int', value: 1 },
      { type: 'Plus' },
      { type: 'Int', value: 2 }])
  })
  test('1-2', () => {
    expect(lexicalAnalyse('1+2')).toStrictEqual([
      { type: 'Int', value: 1 },
      { type: 'Plus' },
      { type: 'Int', value: 2 }])
  })
  test('1*2', () => {
    expect(lexicalAnalyse('1+2')).toStrictEqual([
      { type: 'Int', value: 1 },
      { type: 'Plus' },
      { type: 'Int', value: 2 }])
  })
  test('1/2', () => {
    expect(lexicalAnalyse('1+2')).toStrictEqual([
      { type: 'Int', value: 1 },
      { type: 'Plus' },
      { type: 'Int', value: 2 }])
  })
  test('1==1', () => {
    expect(lexicalAnalyse('1==1')).toStrictEqual([
      { type: 'Int', value: 1 },
      { type: 'EqualEqual' },
      { type: 'Int', value: 1 }])
  })
  test('空白は無視する', () => {
    expect(lexicalAnalyse('\t 1 ')).toStrictEqual([{ type: 'Int', value: 1 }])
    expect(lexicalAnalyse('     ')).toStrictEqual([])
    expect(lexicalAnalyse('1\n2')).toStrictEqual([
      { type: 'Int', value: 1 },
      { type: 'Int', value: 2 }])
  })
  test('無効な文字列', () => {
    expect(lexicalAnalyse('寝')).toStrictEqual([{ type: 'UnknownCharacter', value: '寝' }])
  })
  test('識別子', () => {
    expect(lexicalAnalyse('test abc ABC')).toStrictEqual([
      { type: 'Ident', name: 'test' },
      { type: 'Ident', name: 'abc' },
      { type: 'Ident', name: 'ABC' },
    ])
  })
  test('丸括弧', () => {
    expect(lexicalAnalyse('()')).toStrictEqual([
      { type: 'LParen' },
      { type: 'RParen' },
    ])
  })
  test('波括弧', () => {
    expect(lexicalAnalyse('{}')).toStrictEqual([
      { type: 'LBrace' },
      { type: 'RBrace' },
    ])
  })
  test('コンマ', () => {
    expect(lexicalAnalyse(',')).toStrictEqual([{ type: 'Comma' }])
  })
  test('セミコロン', () => {
    expect(lexicalAnalyse(';')).toStrictEqual([{ type: 'Semicolon' }])
  })
  describe('キーワード', () => {
    test('構文用のキーワード', () => {
      expect(lexicalAnalyse('if def')).toStrictEqual([
        { type: 'If' },
        { type: 'Def' },
      ])
    })
    test('真偽値', () => {
      expect(lexicalAnalyse('true false')).toStrictEqual([
        { type: 'Bool', value: true },
        { type: 'Bool', value: false },
      ])
    })
    test('null', () => {
      expect(lexicalAnalyse('null')).toStrictEqual([{ type: 'Null' }])
    })
  })
})
