const { parse } = require('./parser')
const { lexicalAnalyse } = require('./lexical-analyse')

const lex = lexicalAnalyse

describe('構文解析', () => {
  test('空', () => {
    expect(parse([])).toStrictEqual({ type: 'Source', partsOfSource: [] })
  })
  test('1つの文', () => {
    expect(parse([
      { type: 'Int', value: 123 },
      { type: 'Semicolon' },
    ])).toStrictEqual(
      {
        type: 'Source',
        partsOfSource: [
          { type: 'IntLiteral', value: 123 },
        ],
      },
    )
  })
  test('複数の文', () => {
    expect(parse(lex('1;2;'))).toStrictEqual(
      {
        type: 'Source',
        partsOfSource: [
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
      expect(parse(lex('123;')).partsOfSource[0]).toStrictEqual({ type: 'IntLiteral', value: 123 })
    })
    describe('真偽値', () => {
      test('true', () => {
        expect(parse(lex('true;')).partsOfSource[0]).toStrictEqual({ type: 'BoolLiteral', value: true })
      })
      test('false', () => {
        expect(parse(lex('false;')).partsOfSource[0]).toStrictEqual({ type: 'BoolLiteral', value: false })
      })
    })
    test('null', () => {
      expect(parse(lex('null;')).partsOfSource[0]).toStrictEqual({ type: 'NullLiteral' })
    })
  })
  describe('足し算', () => {
    test('1+2;', () => {
      expect(parse(lex('1+2;')).partsOfSource[0]).toStrictEqual(
        {
          type: 'Add',
          left: { type: 'IntLiteral', value: 1 },
          right: { type: 'IntLiteral', value: 2 },
        },
      )
    })
    test('1+2+3;', () => {
      expect(parse(lex('1+2+3;')).partsOfSource[0]).toStrictEqual(
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
  describe('引き算', () => {
    test('1-2;', () => {
      expect(parse(lex('1-2;')).partsOfSource[0]).toStrictEqual(
        {
          type: 'Subtract',
          left: { type: 'IntLiteral', value: 1 },
          right: { type: 'IntLiteral', value: 2 },
        },
      )
    })
    test('1+2-3;', () => {
      expect(parse(lex('1+2-3;')).partsOfSource[0]).toStrictEqual(
        {
          type: 'Subtract',
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
  describe('かけ算', () => {
    test('1*2;', () => {
      expect(parse(lex('1*2;')).partsOfSource[0]).toStrictEqual(
        {
          type: 'Multiply',
          left: { type: 'IntLiteral', value: 1 },
          right: { type: 'IntLiteral', value: 2 },
        },
      )
    })
    test('1+2*3;', () => {
      expect(parse(lex('1+2*3;')).partsOfSource[0]).toStrictEqual(
        {
          type: 'Add',
          left: { type: 'IntLiteral', value: 1 },
          right: {
            type: 'Multiply',
            left: { type: 'IntLiteral', value: 2 },
            right: { type: 'IntLiteral', value: 3 },
          },
        },
      )
    })
    test('1*2+3;', () => {
      expect(parse(lex('1*2+3;')).partsOfSource[0]).toStrictEqual(
        {
          type: 'Add',
          left: {
            type: 'Multiply',
            left: { type: 'IntLiteral', value: 1 },
            right: { type: 'IntLiteral', value: 2 },
          },
          right: { type: 'IntLiteral', value: 3 },
        },
      )
    })
    test('1*2*3;', () => {
      expect(parse(lex('1*2*3;')).partsOfSource[0]).toStrictEqual(
        {
          type: 'Multiply',
          left: {
            type: 'Multiply',
            left: { type: 'IntLiteral', value: 1 },
            right: { type: 'IntLiteral', value: 2 },
          },
          right: { type: 'IntLiteral', value: 3 },
        },
      )
    })
    test('(1+2)*(3+4);', () => {
      expect(parse(lex('(1+2)*(3+4);')).partsOfSource[0]).toStrictEqual(
        {
          type: 'Multiply',
          left: {
            type: 'Add',
            left: { type: 'IntLiteral', value: 1 },
            right: { type: 'IntLiteral', value: 2 },
          },
          right: {
            type: 'Add',
            left: { type: 'IntLiteral', value: 3 },
            right: { type: 'IntLiteral', value: 4 },
          },
        },
      )
    })
    test('foo()*bar();', () => {
      expect(parse(lex('foo()*bar();')).partsOfSource[0]).toStrictEqual(
        {
          type: 'Multiply',
          left: {
            type: 'FuncCall', name: 'foo', arguments: [],
          },
          right: {
            type: 'FuncCall', name: 'bar', arguments: [],
          },
        },
      )
    })
  })
  describe('割り算', () => {
    test('1/2;', () => {
      expect(parse(lex('1/2;')).partsOfSource[0]).toStrictEqual(
        {
          type: 'Division',
          left: { type: 'IntLiteral', value: 1 },
          right: { type: 'IntLiteral', value: 2 },
        },
      )
    })
    test('1+2/3;', () => {
      expect(parse(lex('1+2/3;')).partsOfSource[0]).toStrictEqual(
        {
          type: 'Add',
          left: { type: 'IntLiteral', value: 1 },
          right: {
            type: 'Division',
            left: { type: 'IntLiteral', value: 2 },
            right: { type: 'IntLiteral', value: 3 },
          },
        },
      )
    })
    test('1/2+3;', () => {
      expect(parse(lex('1/2+3;')).partsOfSource[0]).toStrictEqual(
        {
          type: 'Add',
          left: {
            type: 'Division',
            left: { type: 'IntLiteral', value: 1 },
            right: { type: 'IntLiteral', value: 2 },
          },
          right: { type: 'IntLiteral', value: 3 },
        },
      )
    })
    test('1/2/3;', () => {
      expect(parse(lex('1/2/3;')).partsOfSource[0]).toStrictEqual(
        {
          type: 'Division',
          left: {
            type: 'Division',
            left: { type: 'IntLiteral', value: 1 },
            right: { type: 'IntLiteral', value: 2 },
          },
          right: { type: 'IntLiteral', value: 3 },
        },
      )
    })
    test('(1+2)/(3+4);', () => {
      expect(parse(lex('(1+2)/(3+4);')).partsOfSource[0]).toStrictEqual(
        {
          type: 'Division',
          left: {
            type: 'Add',
            left: { type: 'IntLiteral', value: 1 },
            right: { type: 'IntLiteral', value: 2 },
          },
          right: {
            type: 'Add',
            left: { type: 'IntLiteral', value: 3 },
            right: { type: 'IntLiteral', value: 4 },
          },
        },
      )
    })
    test('foo()*/ar();', () => {
      expect(parse(lex('foo()/bar();')).partsOfSource[0]).toStrictEqual(
        {
          type: 'Division',
          left: {
            type: 'FuncCall', name: 'foo', arguments: [],
          },
          right: {
            type: 'FuncCall', name: 'bar', arguments: [],
          },
        },
      )
    })
  })
  test('変数', () => {
    expect(parse(lex('abc;')).partsOfSource[0]).toStrictEqual(
      { type: 'Variable', name: 'abc' },
    )
  })
  describe('括弧', () => {
    test('括弧の中にリテラル', () => {
      expect(parse(lex('(123);')).partsOfSource[0]).toStrictEqual(
        { type: 'IntLiteral', value: 123 },
      )
    })
    test('括弧と足し算', () => {
      expect(parse(lex('1+(2+3);')).partsOfSource[0]).toStrictEqual(
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
      expect(parse(lex('call();')).partsOfSource[0]).toStrictEqual(
        {
          type: 'FuncCall',
          name: 'call',
          arguments: [],
        },
      )
    })
    test('引数1個', () => {
      expect(parse(lex('abc(12);')).partsOfSource[0]).toStrictEqual(
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
      expect(parse(lex('xxx((12), 3+4);')).partsOfSource[0]).toStrictEqual(
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
      expect(parse(lex('x()+y();')).partsOfSource[0]).toStrictEqual(
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
      expect(parse(lex('yes=true;')).partsOfSource[0]).toStrictEqual(
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
      expect(parse(lex('two=1+1;')).partsOfSource[0]).toStrictEqual(
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
      expect(parse(lex('if(true) { }')).partsOfSource[0]).toStrictEqual(
        {
          type: 'If',
          condition: { type: 'BoolLiteral', value: true },
          statements: [],
        },
      )
    })
    test('文が1個', () => {
      expect(parse(lex('if(true) { 1; }')).partsOfSource[0]).toStrictEqual(
        {
          type: 'If',
          condition: { type: 'BoolLiteral', value: true },
          statements: [{ type: 'IntLiteral', value: 1 }],
        },
      )
    })
    test('文が2個', () => {
      expect(parse(lex('if(true) { 1; 2; }')).partsOfSource[0]).toStrictEqual(
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
        partsOfSource: [
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
    describe('else', () => {
      test('if-else', () => {
        expect(parse(lex('if( true ) { a = 1; } else { a = 2; }')).partsOfSource[0]).toStrictEqual(
          {
            type: 'If',
            condition: { type: 'BoolLiteral', value: true },
            statements: [
              {
                type: 'Assignment',
                name: 'a',
                expression: { type: 'IntLiteral', value: 1 },
              },
            ],
            elseStatements: [
              {
                type: 'Assignment',
                name: 'a',
                expression: { type: 'IntLiteral', value: 2 },
              },
            ],
          },
        )
      })
      test('if-else 文あり', () => {
        expect(parse(lex('if( b == 1 ) { a = 1; } else { a = 2; }')).partsOfSource[0]).toStrictEqual(
          {
            type: 'If',
            condition: {
              type: 'IsEqual',
              left: { type: 'Variable', name: 'b' },
              right: { type: 'IntLiteral', value: 1 },
            },
            statements: [
              {
                type: 'Assignment',
                name: 'a',
                expression: { type: 'IntLiteral', value: 1 },
              },
            ],
            elseStatements: [
              {
                type: 'Assignment',
                name: 'a',
                expression: { type: 'IntLiteral', value: 2 },
              },
            ],
          },
        )
      })
    })
  })
  describe('while', () => {
    test('while 文あり', () => {
      expect(parse(lex('while( b == 1 ) { a = 1; c = 1; }')).partsOfSource[0]).toStrictEqual(
        {
          type: 'While',
          condition: {
            type: 'IsEqual',
            left: { type: 'Variable', name: 'b' },
            right: { type: 'IntLiteral', value: 1 },
          },
          statements: [
            {
              type: 'Assignment',
              name: 'a',
              expression: { type: 'IntLiteral', value: 1 },
            },
            {
              type: 'Assignment',
              name: 'c',
              expression: { type: 'IntLiteral', value: 1 },
            },
          ],
        },
      )
    })
  })
  describe('関数定義', () => {
    test('引数が0個、文が0個', () => {
      expect(parse(lex('def funcname() { }')).partsOfSource[0]).toStrictEqual(
        {
          type: 'FuncDef',
          name: 'funcname',
          arguments: [],
          statements: [],
        },
      )
    })
    test('引数が1個、文が0個', () => {
      expect(parse(lex('def funcname(argument) { }')).partsOfSource[0]).toStrictEqual(
        {
          type: 'FuncDef',
          name: 'funcname',
          arguments: ['argument'],
          statements: [],
        },
      )
    })
    test('引数が2個、文が0個', () => {
      expect(parse(lex('def funcname(xxx, yyy) { }')).partsOfSource[0]).toStrictEqual(
        {
          type: 'FuncDef',
          name: 'funcname',
          arguments: ['xxx', 'yyy'],
          statements: [],
        },
      )
    })
    test('引数が0個、文が1個', () => {
      expect(parse(lex('def funcname() { 123; }')).partsOfSource[0]).toStrictEqual(
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
      expect(parse(lex('def funcname() { 123; 456; }')).partsOfSource[0]).toStrictEqual({
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
