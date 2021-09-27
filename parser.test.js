/* eslint-disable no-undef */

const { parse } = require('./parser')
const { lexicalAnalyse } = require('./lexical-analyse')

describe('構文解析', () => {
  test('空', () => {
    expect(parse([])).toStrictEqual({ type: 'Source', statements: [] })
  })
  test('-', () => {
    expect(parse([{ type: 'Minus' }])).toStrictEqual(
      {
        message: '予期しないトークン`Minus`が渡されました',
        statements: [],
        type: 'SyntaxError',
      },
    )
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
  test('1+', () => {
    expect(parse([
      { type: 'Int', value: 1 },
      { type: 'Plus' },
    ]).type).toBe('SyntaxError')
  })
  test('1+(', () => {
    expect(parse([
      { type: 'Int', value: 1 },
      { type: 'Plus' },
      { type: 'LParen' },
    ]).type).toBe('SyntaxError')
  })
  test('1+2+3', () => {
    expect(parse(lexicalAnalyse('1+2+3'))).toStrictEqual(
      {
        type: 'Source',
        statements: [
          {
            type: 'Add',
            left: {
              type: 'Add',
              left: { type: 'IntLiteral', value: 1 },
              right: { type: 'IntLiteral', value: 2 },
            },
            right: { type: 'IntLiteral', value: 3 },
          },
        ],
      },
    )
  })
  test('複数行', () => {
    expect(parse([
      { type: 'Newline' },
      { type: 'Int', value: 1 },
      { type: 'Newline' },
      { type: 'Int', value: 2 },
      { type: 'Newline' },
    ])).toStrictEqual(
      {
        type: 'Source',
        statements: [
          { type: 'IntLiteral', value: 1 },
          { type: 'IntLiteral', value: 2 },
        ],
      },
    )
  })
  const lex = lexicalAnalyse
  test('変数', () => {
    expect(parse(lex('abc'))).toStrictEqual(
      {
        type: 'Source',
        statements: [
          { type: 'Variable', name: 'abc' },
        ],
      },
    )
  })
  test('括弧', () => {
    expect(parse(lex('(123)'))).toStrictEqual(
      {
        type: 'Source',
        statements: [
          { type: 'IntLiteral', value: 123 },
        ],
      },
    )
  })
  test('入れ子の括弧', () => {
    expect(parse(lex('1+(2+3)'))).toStrictEqual(
      {
        type: 'Source',
        statements: [
          {
            type: 'Add',
            left: { type: 'IntLiteral', value: 1 },
            right: {
              type: 'Add',
              left: { type: 'IntLiteral', value: 2 },
              right: { type: 'IntLiteral', value: 3 },
            },
          },
        ],
      },
    )
  })
  test('関数呼び出し', () => {
    expect(parse(lex('call()'))).toStrictEqual(
      {
        type: 'Source',
        statements: [
          {
            type: 'FuncCall',
            name: 'call',
            arguments: [],
          },
        ],
      },
    )
    expect(parse(lex('abc(12)'))).toStrictEqual(
      {
        type: 'Source',
        statements: [
          {
            type: 'FuncCall',
            name: 'abc',
            arguments: [
              { type: 'IntLiteral', value: 12 },
            ],
          },
        ],
      },
    )
    expect(parse(lex('xxx((12), 3+4)'))).toStrictEqual(
      {
        type: 'Source',
        statements: [
          {
            type: 'FuncCall',
            name: 'xxx',
            arguments: [
              { type: 'IntLiteral', value: 12 },
              {
                type: 'Add',
                left: { type: 'IntLiteral', value: 3 },
                right: { type: 'IntLiteral', value: 4 },
              },
            ],
          },
        ],
      },
    )
    expect(parse(lex('x()+y()'))).toStrictEqual(
      {
        type: 'Source',
        statements: [
          {
            type: 'Add',
            left: {
              type: 'FuncCall',
              name: 'x',
              arguments: [],
            },
            right: {
              type: 'FuncCall',
              name: 'y',
              arguments: [],
            },
          },
        ],
      },
    )
  })
})
