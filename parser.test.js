const { parse } = require('./parser')
const { lexicalAnalyse } = require('./lexical-analyse')

const lex = lexicalAnalyse

describe('構文解析', () => {
  test('空', () => {
    expect(parse([])).toStrictEqual({ type: 'Source', statements: [] })
  })
  test('1つの文', () => {
    expect(parse([
      { type: 'Int', value: 123 },
      { type: 'Semicolon' },
    ])).toStrictEqual(
      {
        type: 'Source',
        statements: [
          { type: 'IntLiteral', value: 123 },
        ],
      },
    )
  })
  test('複数の文', () => {
    expect(parse(lex('1;2;'))).toStrictEqual(
      {
        type: 'Source',
        statements: [
          { type: 'IntLiteral', value: 1 },
          { type: 'IntLiteral', value: 2 },
        ],
      },
    )
  })
  describe('シンタックスエラー', () => {
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
    test('セミコロンのみ', () => {
      expect(parse([{ type: 'Semicolon' }]).type).toBe('SyntaxError')
    })
    test('セミコロンのみ(複数)', () => {
      expect(parse([
        { type: 'Semicolon' },
        { type: 'Semicolon' },
      ]).type).toBe('SyntaxError')
    })
  })
  describe('各種リテラル', () => {
    test('整数', () => {
      expect(parse(lex('123;')).statements[0]).toStrictEqual({ type: 'IntLiteral', value: 123 })
    })
    describe('真偽値', () => {
      test('true', () => {
        expect(parse(lex('true;')).statements[0]).toStrictEqual({ type: 'BoolLiteral', value: true })
      })
      test('false', () => {
        expect(parse(lex('false;')).statements[0]).toStrictEqual({ type: 'BoolLiteral', value: false })
      })
    })
    test('null', () => {
      expect(parse(lex('null;')).statements[0]).toStrictEqual({ type: 'NullLiteral' })
    })
  })
  describe('足し算', () => {
    test('1+2;', () => {
      expect(parse(lex('1+2;')).statements[0]).toStrictEqual(
        {
          type: 'Add',
          left: { type: 'IntLiteral', value: 1 },
          right: { type: 'IntLiteral', value: 2 },
        },
      )
    })
    test('1+2+3;', () => {
      expect(parse(lex('1+2+3;')).statements[0]).toStrictEqual(
        {
          type: 'Add',
          left: {
            type: 'Add',
            left: { type: 'IntLiteral', value: 1 },
            right: { type: 'IntLiteral', value: 2 },
          },
          right: { type: 'IntLiteral', value: 3 },
        },
      )
    })
  })
  test('変数', () => {
    expect(parse(lex('abc;')).statements[0]).toStrictEqual(
      { type: 'Variable', name: 'abc' },
    )
  })
  describe('括弧', () => {
    test('括弧の中にリテラル', () => {
      expect(parse(lex('(123);')).statements[0]).toStrictEqual(
        { type: 'IntLiteral', value: 123 },
      )
    })
    test('括弧と足し算', () => {
      expect(parse(lex('1+(2+3);')).statements[0]).toStrictEqual(
        {
          type: 'Add',
          left: { type: 'IntLiteral', value: 1 },
          right: {
            type: 'Add',
            left: { type: 'IntLiteral', value: 2 },
            right: { type: 'IntLiteral', value: 3 },
          },
        },
      )
    })
  })
  describe('関数呼び出し', () => {
    test('引数0個', () => {
      expect(parse(lex('call();')).statements[0]).toStrictEqual(
        {
          type: 'FuncCall',
          name: 'call',
          arguments: [],
        },
      )
    })
    test('引数1個', () => {
      expect(parse(lex('abc(12);')).statements[0]).toStrictEqual(
        {
          type: 'FuncCall',
          name: 'abc',
          arguments: [
            { type: 'IntLiteral', value: 12 },
          ],
        },
      )
    })
    test('引数2個', () => {
      expect(parse(lex('xxx((12), 3+4);')).statements[0]).toStrictEqual(
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
      )
    })
    test('引数と演算', () => {
      expect(parse(lex('x()+y();')).statements[0]).toStrictEqual(
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
      )
    })
    test('引数の構文解析に失敗', () => {
      expect(parse(lex('func(+);')).type).toBe('SyntaxError')
    })
  })
  describe('代入文', () => {
    test('代入とリテラル', () => {
      expect(parse(lex('yes=true;')).statements[0]).toStrictEqual(
        {
          type: 'Assignment',
          name: 'yes',
          expression: {
            type: 'BoolLiteral',
            value: true,
          },
        },
      )
    })
    test('代入と足し算', () => {
      expect(parse(lex('two=1+1;')).statements[0]).toStrictEqual(
        {
          type: 'Assignment',
          name: 'two',
          expression: {
            type: 'Add',
            left: { type: 'IntLiteral', value: 1 },
            right: { type: 'IntLiteral', value: 1 },
          },
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
      expect(parse(lex('if(true) { }')).statements[0]).toStrictEqual(
        {
          type: 'If',
          condition: { type: 'BoolLiteral', value: true },
          statements: [],
        },
      )
    })
    test('文が1個', () => {
      expect(parse(lex('if(true) { 1; }')).statements[0]).toStrictEqual(
        {
          type: 'If',
          condition: { type: 'BoolLiteral', value: true },
          statements: [{ type: 'IntLiteral', value: 1 }],
        },
      )
    })
    test('文が2個', () => {
      expect(parse(lex('if(true) { 1; 2; }')).statements[0]).toStrictEqual(
        {
          type: 'If',
          condition: { type: 'BoolLiteral', value: true },
          statements: [
            { type: 'IntLiteral', value: 1 },
            { type: 'IntLiteral', value: 2 },
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
      expect(parse(lex('def funcname() { }')).statements[0]).toStrictEqual(
        {
          type: 'FuncDef',
          name: 'funcname',
          arguments: [],
          statements: [],
        },
      )
    })
    test('引数が1個、文が0個', () => {
      expect(parse(lex('def funcname(argument) { }')).statements[0]).toStrictEqual(
        {
          type: 'FuncDef',
          name: 'funcname',
          arguments: ['argument'],
          statements: [],
        },
      )
    })
    test('引数が2個、文が0個', () => {
      expect(parse(lex('def funcname(xxx, yyy) { }')).statements[0]).toStrictEqual(
        {
          type: 'FuncDef',
          name: 'funcname',
          arguments: ['xxx', 'yyy'],
          statements: [],
        },
      )
    })
    test('引数が0個、文が1個', () => {
      expect(parse(lex('def funcname() { 123; }')).statements[0]).toStrictEqual(
        {
          type: 'FuncDef',
          name: 'funcname',
          arguments: [],
          statements: [
            { type: 'IntLiteral', value: 123 },
          ],
        },
      )
    })
    test('引数が0個、文が2個', () => {
      expect(parse(lex('def funcname() { 123; 456; }')).statements[0]).toStrictEqual({
        type: 'FuncDef',
        name: 'funcname',
        arguments: [],
        statements: [
          { type: 'IntLiteral', value: 123 },
          { type: 'IntLiteral', value: 456 },
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
