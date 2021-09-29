/* eslint-disable no-undef */

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
  test('空白は無視する', () => {
    expect(lexicalAnalyse('\t 1 ')).toStrictEqual([{ type: 'Int', value: 1 }])
    expect(lexicalAnalyse('     ')).toStrictEqual([])
    expect(lexicalAnalyse('1\n2')).toStrictEqual([
      { type: 'Int', value: 1 },
      { type: 'Int', value: 2 }])
  })
  test('無効な文字列', () => {
    expect(lexicalAnalyse('あ')).toStrictEqual([{ type: 'UnknownCharacter', value: 'あ' }])
  })
  test('識別子', () => {
    expect(lexicalAnalyse('test abc')).toStrictEqual([
      { type: 'Ident', value: 'test' },
      { type: 'Ident', value: 'abc' },
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
    expect(lexicalAnalyse('if def')).toStrictEqual([
      { type: 'If' },
      { type: 'Def' },
    ])
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
