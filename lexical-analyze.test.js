const { lexicalAnalyze } = require('./lexical-analyze')

describe('字句解析', () => {
  test('空文字列', () => {
    expect(lexicalAnalyze('')).toStrictEqual([])
  })
  test('1', () => {
    expect(lexicalAnalyze('1')).toStrictEqual([{ type: 'Int', value: 1 }])
  })
  test('123', () => {
    expect(lexicalAnalyze('123')).toStrictEqual([{ type: 'Int', value: 123 }])
  })
  test('+', () => {
    expect(lexicalAnalyze('+')).toStrictEqual([{ type: 'Plus' }])
  })
  test('=', () => {
    expect(lexicalAnalyze('=')).toStrictEqual([{ type: 'Equal' }])
  })
  test('1+2', () => {
    expect(lexicalAnalyze('1+2')).toStrictEqual([
      { type: 'Int', value: 1 },
      { type: 'Plus' },
      { type: 'Int', value: 2 }])
  })
  test('空白は無視する', () => {
    expect(lexicalAnalyze('\t 1 ')).toStrictEqual([{ type: 'Int', value: 1 }])
    expect(lexicalAnalyze('     ')).toStrictEqual([])
    expect(lexicalAnalyze('1\n2')).toStrictEqual([
      { type: 'Int', value: 1 },
      { type: 'Int', value: 2 }])
  })
  test('無効な文字列', () => {
    expect(lexicalAnalyze('あ')).toStrictEqual([{ type: 'UnknownCharacter', value: 'あ' }])
  })
  test('識別子', () => {
    expect(lexicalAnalyze('test abc')).toStrictEqual([
      { type: 'Ident', name: 'test' },
      { type: 'Ident', name: 'abc' },
    ])
  })
  test('丸括弧', () => {
    expect(lexicalAnalyze('()')).toStrictEqual([
      { type: 'LParen' },
      { type: 'RParen' },
    ])
  })
  test('波括弧', () => {
    expect(lexicalAnalyze('{}')).toStrictEqual([
      { type: 'LBrace' },
      { type: 'RBrace' },
    ])
  })
  test('コンマ', () => {
    expect(lexicalAnalyze(',')).toStrictEqual([{ type: 'Comma' }])
  })
  test('セミコロン', () => {
    expect(lexicalAnalyze(';')).toStrictEqual([{ type: 'Semicolon' }])
  })
  describe('キーワード', () => {
    test('構文用のキーワード', () => {
      expect(lexicalAnalyze('if def')).toStrictEqual([
        { type: 'If' },
        { type: 'Def' },
      ])
    })
    test('真偽値', () => {
      expect(lexicalAnalyze('true false')).toStrictEqual([
        { type: 'Bool', value: true },
        { type: 'Bool', value: false },
      ])
    })
    test('null', () => {
      expect(lexicalAnalyze('null')).toStrictEqual([{ type: 'Null' }])
    })
  })
})
