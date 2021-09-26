/* eslint-disable no-undef */

const interpriter = require('./interpriter')

const { lexicalAnalyse, parse } = interpriter

describe('字句解析', () => {
  test('1', () => {
    expect(lexicalAnalyse('1')).toStrictEqual([{ type: 'Int', value: 1 }])
  })
  test('123', () => {
    expect(lexicalAnalyse('123')).toStrictEqual([{ type: 'Int', value: 123 }])
  })
  test('+', () => {
    expect(lexicalAnalyse('+')).toStrictEqual([{ type: 'Plus' }])
  })
  test('1+2', () => {
    expect(lexicalAnalyse('1+2')).toStrictEqual([
      { type: 'Int', value: 1 },
      { type: 'Plus' },
      { type: 'Int', value: 2 }])
  })
  test('改行', () => {
    expect(lexicalAnalyse('1\n2')).toStrictEqual([
      { type: 'Int', value: 1 },
      { type: 'Newline' },
      { type: 'Int', value: 2 }])
  })
  test('空白は無視する', () => {
    expect(lexicalAnalyse('\t 1 ')).toStrictEqual([{ type: 'Int', value: 1 }])
    expect(lexicalAnalyse('     ')).toStrictEqual([])
  })
  test('無効な文字列', () => {
    expect(lexicalAnalyse('あ')).toStrictEqual([{ type: 'UnknownCharacter', value: 'あ' }])
  })
})

describe('構文解析', () => {
  test('空', () => {
    expect(parse([])).toStrictEqual({ type: 'Source', statements: [] })
  })
  test('1', () => {
    expect(parse([
      { type: 'Int', value: 1 },
    ])).toStrictEqual(
      {
        type: 'Source',
        statements: [
          { type: 'IntLiteral', value: 1 },
        ],
      },
    )
  })
  test('1+2', () => {
    expect(parse([
      { type: 'Int', value: 1 },
      { type: 'Plus' },
      { type: 'Int', value: 2 },
    ])).toStrictEqual(
      {
        type: 'Source',
        statements: [
          {
            type: 'Add',
            left: { type: 'IntLiteral', value: 1 },
            right: { type: 'IntLiteral', value: 2 },
          },
        ],
      },
    )
  })
})
