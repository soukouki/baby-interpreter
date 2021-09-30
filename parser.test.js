/* eslint-disable no-undef */

const { parse } = require('./parser')
const { lexicalAnalyse } = require('./lexical-analyse')

describe('構文解析', () => {
  test('空', () => {
    expect(parse([])).toStrictEqual({ type: 'Source', statements: [] })
  })
  test('1;', () => {
    expect(parse([
      { type: 'Int', value: 1 },
      { type: 'Semicolon' },
    ])).toStrictEqual(
      {
        type: 'Source',
        statements: [
          { type: 'IntLiteral', value: 1 },
        ],
      },
    )
  })
  test('1+2;', () => {
    expect(parse([
      { type: 'Int', value: 1 },
      { type: 'Plus' },
      { type: 'Int', value: 2 },
      { type: 'Semicolon' },
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
  describe('シンタックスエラー系', () => {
    test('1', () => {
      expect(parse([
        { type: 'Int', value: 1 },
      ]).type).toBe('SyntaxError')
    })
    test('1+;', () => {
      expect(parse([
        { type: 'Int', value: 1 },
        { type: 'Plus' },
        { type: 'Semicolon' },
      ]).type).toBe('SyntaxError')
    })
    test('1+(;', () => {
      expect(parse([
        { type: 'Int', value: 1 },
        { type: 'Plus' },
        { type: 'LParen' },
        { type: 'Semicolon' },
      ]).type).toBe('SyntaxError')
    })
    test('複数の文(空)', () => {
      expect(parse([{ type: 'Semicolon' }]).type).toBe('SyntaxError')
    })
    test('複数の文(空)', () => {
      expect(parse([
        { type: 'Semicolon' },
        { type: 'Semicolon' },
      ]).type).toBe('SyntaxError')
    })
  })
  const lex = lexicalAnalyse
  test('1+2+3;', () => {
    expect(parse(lex('1+2+3;'))).toStrictEqual(
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
  test('複数の文', () => {
    expect(parse(lex('1;\n2;'))).toStrictEqual(
      {
        type: 'Source',
        statements: [
          { type: 'IntLiteral', value: 1 },
          { type: 'IntLiteral', value: 2 },
        ],
      },
    )
  })
  describe('各種リテラル', () => {
    test('整数', () => {
      expect(parse(lex('123;'))).toStrictEqual(
        {
          type: 'Source',
          statements: [{ type: 'IntLiteral', value: 123 }],
        },
      )
    })
    describe('真偽値', () => {
      test('true', () => {
        expect(parse(lex('true;'))).toStrictEqual(
          {
            type: 'Source',
            statements: [{ type: 'BoolLiteral', value: true }],
          },
        )
      })
      test('false', () => {
        expect(parse(lex('false;'))).toStrictEqual(
          {
            type: 'Source',
            statements: [{ type: 'BoolLiteral', value: false }],
          },
        )
      })
    })
    test('null', () => {
      expect(parse(lex('null;'))).toStrictEqual(
        {
          type: 'Source',
          statements: [{ type: 'NullLiteral' }],
        },
      )
    })
  })
  test('変数', () => {
    expect(parse(lex('abc;'))).toStrictEqual(
      {
        type: 'Source',
        statements: [
          { type: 'Variable', name: 'abc' },
        ],
      },
    )
  })
  test('括弧', () => {
    expect(parse(lex('(123);'))).toStrictEqual(
      {
        type: 'Source',
        statements: [
          { type: 'IntLiteral', value: 123 },
        ],
      },
    )
  })
  test('入れ子の括弧', () => {
    expect(parse(lex('1+(2+3);'))).toStrictEqual(
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
  describe('関数呼び出し', () => {
    test('引数0個', () => {
      expect(parse(lex('call();'))).toStrictEqual(
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
    })
    test('引数1個', () => {
      expect(parse(lex('abc(12);'))).toStrictEqual(
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
    })
    test('引数2個', () => {
      expect(parse(lex('xxx((12), 3+4);'))).toStrictEqual(
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
    })
    test('引数と演算', () => {
      expect(parse(lex('x()+y();'))).toStrictEqual(
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
    test('引数の構文解析に失敗', () => {
      expect(parse(lex('func(+);')).type).toBe('SyntaxError')
    })
  })
  describe('代入文', () => {
    test('基本の形', () => {
      expect(parse(lex('two=1+1;'))).toStrictEqual(
        {
          type: 'Source',
          statements: [
            {
              type: 'Assignment',
              name: 'two',
              expression: {
                type: 'Add',
                left: { type: 'IntLiteral', value: 1 },
                right: { type: 'IntLiteral', value: 1 },
              },
            },
          ],
        },
      )
    })
    test('セミコロンの確認', () => {
      expect(parse(lex('two=1+1')).type).toBe('SyntaxError')
    })
    test('式の構文解析に失敗', () => {
      expect(parse(lex('a=;')).type).toBe('SyntaxError')
    })
  })
  describe('if', () => {
    test('文が0個', () => {
      expect(parse(lex('if(true) { }'))).toStrictEqual(
        {
          type: 'Source',
          statements: [
            {
              type: 'If',
              condition: { type: 'BoolLiteral', value: true },
              statements: [],
            },
          ],
        },
      )
    })
    test('文が1個', () => {
      expect(parse(lex('if(true) { 1; }'))).toStrictEqual(
        {
          type: 'Source',
          statements: [
            {
              type: 'If',
              condition: { type: 'BoolLiteral', value: true },
              statements: [{ type: 'IntLiteral', value: 1 }],
            },
          ],
        },
      )
    })
    test('文が2個', () => {
      expect(parse(lex('if(true) { 1; 2; }'))).toStrictEqual(
        {
          type: 'Source',
          statements: [
            {
              type: 'If',
              condition: { type: 'BoolLiteral', value: true },
              statements: [
                { type: 'IntLiteral', value: 1 },
                { type: 'IntLiteral', value: 2 },
              ],
            },
          ],
        },
      )
    })
    describe('エラー処理', () => {
      test('丸括弧が閉じず失敗', () => {
        expect(parse(lex('if(1')).type).toBe('SyntaxError')
      })
      test('ブロックの構文解析に失敗', () => {
        expect(parse(lex('if(true) { 1+1 }')).type).toBe('SyntaxError')
      })
      test('ブロックがなくて失敗', () => {
        expect(parse(lex('if(false)')).type).toBe('SyntaxError')
      })
      test('ブロックが閉じず失敗', () => {
        expect(parse(lex('if(false){')).type).toBe('SyntaxError')
      })
    })
    test('ifの後の式', () => {
      expect(parse(lex('if(true){ } 123;'))).toStrictEqual({
        type: 'Source',
        statements: [
          {
            type: 'If',
            condition: { type: 'BoolLiteral', value: true },
            statements: [],
          },
          {
            type: 'IntLiteral',
            value: 123,
          },
        ],
      })
    })
  })
  describe('関数定義', () => {
    test('引数が0個、文が0個', () => {
      expect(parse(lex('def funcname() { }'))).toStrictEqual({
        type: 'Source',
        statements: [
          {
            type: 'FuncDef',
            name: 'funcname',
            arguments: [],
            statements: [],
          },
        ],
      })
    })
    test('引数が1個、文が0個', () => {
      expect(parse(lex('def funcname(argument) { }'))).toStrictEqual({
        type: 'Source',
        statements: [
          {
            type: 'FuncDef',
            name: 'funcname',
            arguments: ['argument'],
            statements: [],
          },
        ],
      })
    })
    test('引数が2個、文が0個', () => {
      expect(parse(lex('def funcname(xxx, yyy) { }'))).toStrictEqual({
        type: 'Source',
        statements: [
          {
            type: 'FuncDef',
            name: 'funcname',
            arguments: ['xxx', 'yyy'],
            statements: [],
          },
        ],
      })
    })
    test('引数が0個、文が1個', () => {
      expect(parse(lex('def funcname() { 123; }'))).toStrictEqual({
        type: 'Source',
        statements: [
          {
            type: 'FuncDef',
            name: 'funcname',
            arguments: [],
            statements: [
              { type: 'IntLiteral', value: 123 },
            ],
          },
        ],
      })
    })
    test('引数が0個、文が2個', () => {
      expect(parse(lex('def funcname() { 123; 456; }'))).toStrictEqual({
        type: 'Source',
        statements: [
          {
            type: 'FuncDef',
            name: 'funcname',
            arguments: [],
            statements: [
              { type: 'IntLiteral', value: 123 },
              { type: 'IntLiteral', value: 456 },
            ],
          },
        ],
      })
    })
    describe('エラー処理', () => {
      test('引数に違うトークン', () => {
        expect(parse(lex('def name(123)')).type).toBe('SyntaxError')
        expect(parse(lex('def name(abc, 123)')).type).toBe('SyntaxError')
      })
      test('引数の括弧が閉じない', () => {
        expect(parse(lex('def name(')).type).toBe('SyntaxError')
      })
      test('ブロックの括弧が閉じない', () => {
        expect(parse(lex('def name() {')).type).toBe('SyntaxError')
      })
      test('ブロックでエラー', () => {
        expect(parse(lex('def name() { nonsemicolon }')).type).toBe('SyntaxError')
      })
    })
  })
})
