/* eslint-disable no-undef */

const { evaluate } = require('./evaluator')
const { parse } = require('./parser')
const { lexicalAnalyse } = require('./lexical-analyse')
const {
  emptyEnvironment, nullValue, intValue, boolValue,
} = require('./value')

function lexAndParse(source) {
  return parse(lexicalAnalyse(source))
}

describe('評価', () => {
  describe('エラー処理', () => {
    test('不明なAST', () => {
      expect(evaluate({
        type: 'Source',
        statements: [{ type: 'UnknownAST' }],
      }, {
        variables: new Map(),
        functions: new Map(),
      }).result.type).toBe('EvaluatorError')
    })
    test('型エラー', () => {
      expect(evaluate(lexAndParse('a+1;'), {
        variables: new Map([['a', { type: 'NullValue' }]]),
        functions: new Map(),
      }).result.type).toBe('TypeError')
    })
  })
  test('1;', () => {
    expect(evaluate({
      type: 'Source',
      statements: [
        { type: 'IntLiteral', value: 1 },
      ],
    }, {
      variables: new Map(),
      functions: new Map(),
    })).toStrictEqual(
      {
        result: {
          type: 'IntValue',
          isError: false,
          value: 1,
        },
        environment: {
          variables: new Map(),
          functions: new Map(),
        },
      },
    )
  })
  describe('Add', () => {
    test('1+2;', () => {
      expect(evaluate(lexAndParse('1+2;'), emptyEnvironment)).toStrictEqual(
        {
          result: {
            type: 'IntValue',
            isError: false,
            value: 3,
          },
          environment: {
            variables: new Map(),
            functions: new Map(),
          },
        },
      )
    })
    test('エラー時にエラーを上げていく処理', () => {
      expect(evaluate(lexAndParse('(1+non)+23;'), emptyEnvironment).result.type).toBe('TypeError')
      expect(evaluate(lexAndParse('1+(non+23);'), emptyEnvironment).result.type).toBe('TypeError')
    })
  })
  test('複数の文', () => {
    expect(evaluate(lexAndParse('1;2;'), emptyEnvironment)).toStrictEqual(
      {
        result: {
          type: 'IntValue',
          isError: false,
          value: 2,
        },
        environment: {
          variables: new Map(),
          functions: new Map(),
        },
      },
    )
  })
  test('代入文', () => {
    expect(evaluate(lexAndParse('a=1;'), emptyEnvironment)).toStrictEqual(
      {
        result: {
          type: 'NullValue',
          isError: false,
        },
        environment: {
          variables: new Map([
            ['a', {
              type: 'IntValue',
              isError: false,
              value: 1,
            }],
          ]),
          functions: new Map(),
        },
      },
    )
  })
  describe('変数の参照', () => {
    test('正常な参照', () => {
      expect(evaluate(lexAndParse('value;'), {
        variables: new Map([
          ['value', {
            type: 'IntValue',
            isError: false,
            value: 123,
          }],
        ]),
        functions: new Map(),
      })).toStrictEqual(
        {
          result: {
            type: 'IntValue',
            isError: false,
            value: 123,
          },
          environment: {
            variables: new Map([
              ['value', {
                type: 'IntValue',
                isError: false,
                value: 123,
              }],
            ]),
            functions: new Map(),
          },
        },
      )
    })
    test('存在しない参照', () => {
      expect(evaluate(lexAndParse('non;'), emptyEnvironment)).toStrictEqual(
        {
          result: {
            type: 'NullValue',
            isError: false,
          },
          environment: {
            variables: new Map(),
            functions: new Map(),
          },
        },
      )
    })
  })
  describe('各種リテラル', () => {
    test('整数', () => {
      expect(evaluate(lexAndParse('123;'), emptyEnvironment)).toStrictEqual(
        {
          result: {
            type: 'IntValue',
            isError: false,
            value: 123,
          },
          environment: {
            variables: new Map(),
            functions: new Map(),
          },
        },
      )
    })
    describe('真偽値', () => {
      test('true', () => {
        expect(evaluate(lexAndParse('true;'), emptyEnvironment)).toStrictEqual(
          {
            result: {
              type: 'BoolValue',
              isError: false,
              value: true,
            },
            environment: emptyEnvironment,
          },
        )
      })
      test('false', () => {
        expect(evaluate(lexAndParse('false;'), emptyEnvironment)).toStrictEqual(
          {
            result: {
              type: 'BoolValue',
              isError: false,
              value: false,
            },
            environment: emptyEnvironment,
          },
        )
      })
    })
    test('null', () => {
      expect(evaluate(lexAndParse('null;'), emptyEnvironment)).toStrictEqual(
        {
          result: {
            type: 'NullValue',
            isError: false,
          },
          environment: emptyEnvironment,
        },
      )
    })
  })
  describe('if', () => {
    test('trueのとき', () => {
      expect(evaluate(lexAndParse('if(true){a=1;}'), emptyEnvironment)).toStrictEqual({
        result: nullValue,
        environment: {
          variables: new Map([
            ['a', intValue(1)],
          ]),
          functions: new Map(),
        },
      })
    })
    test('falseのとき', () => {
      expect(evaluate(lexAndParse('if(false){a=1;}'), emptyEnvironment)).toStrictEqual({
        result: nullValue,
        environment: emptyEnvironment,
      })
    })
    test('intのとき', () => {
      expect(evaluate(lexAndParse('if(123){a=1;}'), emptyEnvironment)).toStrictEqual({
        result: nullValue,
        environment: {
          variables: new Map([
            ['a', intValue(1)],
          ]),
          functions: new Map(),
        },
      })
    })
    test('nullのとき', () => {
      expect(evaluate(lexAndParse('if(null){a=1;}'), emptyEnvironment)).toStrictEqual({
        result: nullValue,
        environment: emptyEnvironment,
      })
    })
    test('文が0個', () => {
      expect(evaluate(lexAndParse('if(true){}'), emptyEnvironment)).toStrictEqual({
        result: nullValue,
        environment: emptyEnvironment,
      })
    })
    test('文が1個', () => {
      expect(evaluate(lexAndParse('if(true){ 1; }'), emptyEnvironment)).toStrictEqual({
        result: intValue(1),
        environment: emptyEnvironment,
      })
    })
    test('文が2個', () => {
      expect(evaluate(lexAndParse('if(true){ 2; 3; }'), emptyEnvironment)).toStrictEqual({
        result: intValue(3),
        environment: emptyEnvironment,
      })
    })
    describe('エラーが起きる計算の処理', () => {
      test('条件分でエラー', () => {
        expect(evaluate(lexAndParse('if(1+true){ }'), emptyEnvironment).result.type).toBe('TypeError')
      })
      test('実行部分でエラー', () => {
        expect(evaluate(lexAndParse('if(true){ 1+true; 1234; }'), emptyEnvironment).result.type).toBe('TypeError')
      })
    })
  })
  describe('組み込み関数', () => {
    test('組み込み関数が呼べることの確認', () => {
      const embededFunction = jest.fn()
      const environmentWithEmbededFunction = {
        variables: new Map(),
        functions: new Map([
          ['embeded', {
            type: 'EmbededFunction',
            argumentsCount: 0,
            function: embededFunction,
          }],
        ]),
      }
      expect(evaluate(lexAndParse('embeded();'), environmentWithEmbededFunction)).toStrictEqual(
        {
          result: nullValue,
          environment: environmentWithEmbededFunction,
        },
      )
      expect(embededFunction.mock.calls).toEqual([[]])
    })
    describe('組み込み関数に引数を渡せることの確認', () => {
      test('整数', () => {
        const embededFunction = jest.fn()
        const environmentWithEmbededFunction = {
          variables: new Map(),
          functions: new Map([
            ['embeded', {
              type: 'EmbededFunction',
              argumentsCount: 1,
              function: embededFunction,
            }],
          ]),
        }
        expect(evaluate(lexAndParse('embeded(123);'), environmentWithEmbededFunction)).toStrictEqual(
          {
            result: nullValue,
            environment: environmentWithEmbededFunction,
          },
        )
        expect(embededFunction.mock.calls).toEqual([[123]])
      })
      test('真偽値', () => {
        const embededFunction = jest.fn()
        const environmentWithEmbededFunction = {
          variables: new Map(),
          functions: new Map([
            ['embeded', {
              type: 'EmbededFunction',
              argumentsCount: 2,
              function: embededFunction,
            }],
          ]),
        }
        expect(evaluate(lexAndParse('embeded(true, false);'), environmentWithEmbededFunction)).toStrictEqual(
          {
            result: nullValue,
            environment: environmentWithEmbededFunction,
          },
        )
        expect(embededFunction.mock.calls).toEqual([[true, false]])
      })
      test('null', () => {
        const embededFunction = jest.fn()
        const environmentWithEmbededFunction = {
          variables: new Map(),
          functions: new Map([
            ['embeded', {
              type: 'EmbededFunction',
              argumentsCount: 2,
              function: embededFunction,
            }],
          ]),
        }
        expect(evaluate(lexAndParse('embeded(null, 1+2);'), environmentWithEmbededFunction)).toStrictEqual(
          {
            result: nullValue,
            environment: environmentWithEmbededFunction,
          },
        )
        expect(embededFunction.mock.calls).toEqual([[null, 3]])
      })
    })
    describe('組み込み関数から値が返ることの確認', () => {
      test('整数', () => {
        const embededFunction = jest.fn()
        const environmentWithEmbededFunction = {
          variables: new Map(),
          functions: new Map([
            ['embeded', {
              type: 'EmbededFunction',
              argumentsCount: 0,
              function: embededFunction,
            }],
          ]),
        }
        embededFunction.mockReturnValue(123)
        expect(evaluate(lexAndParse('embeded();'), environmentWithEmbededFunction)).toStrictEqual(
          {
            result: intValue(123),
            environment: environmentWithEmbededFunction,
          },
        )
        expect(embededFunction).toHaveBeenCalled()
      })
      describe('真偽値', () => {
        test('true', () => {
          const embededFunction = jest.fn()
          const environmentWithEmbededFunction = {
            variables: new Map(),
            functions: new Map([
              ['embeded', {
                type: 'EmbededFunction',
                argumentsCount: 0,
                function: embededFunction,
              }],
            ]),
          }
          embededFunction.mockReturnValue(true)
          expect(evaluate(lexAndParse('embeded();'), environmentWithEmbededFunction)).toStrictEqual(
            {
              result: boolValue(true),
              environment: environmentWithEmbededFunction,
            },
          )
          expect(embededFunction).toHaveBeenCalled()
        })
        test('false', () => {
          const embededFunction = jest.fn()
          const environmentWithEmbededFunction = {
            variables: new Map(),
            functions: new Map([
              ['embeded', {
                type: 'EmbededFunction',
                argumentsCount: 0,
                function: embededFunction,
              }],
            ]),
          }
          embededFunction.mockReturnValue(false)
          expect(evaluate(lexAndParse('embeded();'), environmentWithEmbededFunction)).toStrictEqual(
            {
              result: boolValue(false),
              environment: environmentWithEmbededFunction,
            },
          )
          expect(embededFunction).toHaveBeenCalled()
        })
      })
      test('null', () => {
        const embededFunction = jest.fn()
        const environmentWithEmbededFunction = {
          variables: new Map(),
          functions: new Map([
            ['embeded', {
              type: 'EmbededFunction',
              argumentsCount: 0,
              function: embededFunction,
            }],
          ]),
        }
        embededFunction.mockReturnValue(null)
        expect(evaluate(lexAndParse('embeded();'), environmentWithEmbededFunction)).toStrictEqual(
          {
            result: nullValue,
            environment: environmentWithEmbededFunction,
          },
        )
        expect(embededFunction).toHaveBeenCalled()
      })
    })
    test('引数でエラーが起きたときの処理', () => {
      const functionDefinedEnvironment = {
        variables: new Map(),
        functions: new Map([['func', { type: 'EmbededFunction', argumentsCount: 1 }]]),
      }
      expect(evaluate(lexAndParse('func(1+null);'), functionDefinedEnvironment).result.type).toBe('TypeError')
    })
  })
  describe('関数定義', () => {
    test('定義ができることの確認', () => {
      expect(evaluate(lexAndParse('def func() { 123; }'), emptyEnvironment)).toStrictEqual(
        {
          result: nullValue,
          environment: {
            variables: new Map(),
            functions: new Map([
              ['func', {
                type: 'DefinedFunction',
                argumentsCount: 0,
                arguments: [],
                statements: [{ type: 'IntLiteral', value: 123 }],
              }],
            ]),
          },
        },
      )
    })
    test('引数を付けて定義ができることの確認', () => {
      expect(evaluate(lexAndParse('def func(abc) { abc; }'), emptyEnvironment)).toStrictEqual(
        {
          result: nullValue,
          environment: {
            variables: new Map(),
            functions: new Map([
              ['func', {
                type: 'DefinedFunction',
                argumentsCount: 1,
                arguments: ['abc'],
                statements: [{ type: 'Variable', name: 'abc' }],
              }],
            ]),
          },
        },
      )
    })
    test('すでに定義されている関数を上書き', () => {
      const functionDefinedEnvironment = {
        variables: new Map(),
        functions: new Map([['func', { type: 'DummyFunction' }]]),
      }
      expect(evaluate(lexAndParse('def func() { 123; }'), functionDefinedEnvironment)).toStrictEqual(
        {
          result: nullValue,
          environment: {
            variables: new Map(),
            functions: new Map([
              ['func', {
                type: 'DefinedFunction',
                argumentsCount: 0,
                arguments: [],
                statements: [{ type: 'IntLiteral', value: 123 }],
              }],
            ]),
          },
        },
      )
    })
    test('定義した関数を呼べることの確認', () => {
      expect(evaluate(lexAndParse('def func() { 123; } func();'), emptyEnvironment)).toStrictEqual(
        {
          result: intValue(123),
          environment: {
            variables: new Map(),
            functions: new Map([
              ['func', {
                type: 'DefinedFunction',
                argumentsCount: 0,
                arguments: [],
                statements: [{ type: 'IntLiteral', value: 123 }],
              }],
            ]),
          },
        },
      )
    })
    test('定義した関数に引数を付けて呼べることの確認', () => {
      expect(evaluate(lexAndParse('def func(abc) { abc; } func(123);'), emptyEnvironment)).toStrictEqual(
        {
          result: intValue(123),
          environment: {
            variables: new Map(),
            functions: new Map([
              ['func', {
                type: 'DefinedFunction',
                argumentsCount: 1,
                arguments: ['abc'],
                statements: [{ type: 'Variable', name: 'abc' }],
              }],
            ]),
          },
        },
      )
    })
    test('定義した関数と環境が違うことの確認', () => {
      expect(evaluate(lexAndParse('abc = 123; def func() { abc=456; } func(); abc;'), emptyEnvironment)).toStrictEqual(
        {
          result: intValue(123),
          environment: {
            variables: new Map([['abc', intValue(123)]]),
            functions: new Map([
              ['func', {
                type: 'DefinedFunction',
                argumentsCount: 0,
                arguments: [],
                statements: [
                  {
                    type: 'Assignment',
                    name: 'abc',
                    expression: { type: 'IntLiteral', value: 456 },
                  },
                ],
              }],
            ]),
          },
        },
      )
    })
    test('定義した関数の仮引数と環境が違うことの確認', () => {
      expect(evaluate(lexAndParse('abc = 123; def func(abc) { } func(456); abc;'), emptyEnvironment)).toStrictEqual(
        {
          result: intValue(123),
          environment: {
            variables: new Map([['abc', intValue(123)]]),
            functions: new Map([
              ['func', {
                type: 'DefinedFunction',
                argumentsCount: 1,
                arguments: ['abc'],
                statements: [],
              }],
            ]),
          },
        },
      )
    })
    test('定義した関数の中で関数を呼べることの確認', () => {
      expect(evaluate(lexAndParse('def a(){b();} def b(){123;} a();'), emptyEnvironment)).toStrictEqual(
        {
          result: intValue(123),
          environment: {
            variables: new Map(),
            functions: new Map([
              ['a', {
                type: 'DefinedFunction',
                argumentsCount: 0,
                arguments: [],
                statements: [{ type: 'FuncCall', name: 'b', arguments: [] }],
              }],
              ['b', {
                type: 'DefinedFunction',
                argumentsCount: 0,
                arguments: [],
                statements: [{ type: 'IntLiteral', value: 123 }],
              }],
            ]),
          },
        },
      )
    })
    test('定義した関数の中で自身の関数を呼べることの確認', () => {
      const embededFunctions = [
        ['notequal', {
          type: 'EmbededFunction',
          argumentsCount: 2,
          function: (a, b) => a !== b,
        }],
        ['or', {
          type: 'EmbededFunction',
          argumentsCount: 2,
          function: (a, b) => a || b,
        }],
      ]
      const definedEmbededFunctionEnvironment = {
        variables: new Map(),
        functions: new Map(embededFunctions),
      }
      // なぜかJSON.stringifyしないとテストが失敗する
      expect(JSON.stringify(evaluate(
        lexAndParse('def func(n) { if(notequal(n, 5)) { res = func(n+1); } or(res, n); } func(0);'),
        definedEmbededFunctionEnvironment,
      ))).toEqual(JSON.stringify(
        {
          result: intValue(5),
          environment: {
            variables: new Map(),
            functions: new Map(
              [
                ['notequal', {
                  type: 'EmbededFunction',
                  argumentsCount: 2,
                  function: (a, b) => a !== b,
                }],
                ['or', {
                  type: 'EmbededFunction',
                  argumentsCount: 2,
                  function: (a, b) => a || b,
                }],
                ['func', {
                  type: 'DefinedFunction',
                  argumentsCount: 1,
                  arguments: ['n'],
                  statements: [
                    {
                      type: 'If',
                      condition: {
                        type: 'FuncCall',
                        name: 'notequal',
                        arguments: [
                          { type: 'Variable', name: 'n' },
                          { type: 'IntLiteral', value: 5 },
                        ],
                      },
                      statements: [
                        {
                          type: 'Assignment',
                          name: 'res',
                          expression: {
                            type: 'FuncCall',
                            name: 'func',
                            arguments: [{
                              type: 'Add',
                              left: { type: 'Variable', name: 'n' },
                              right: { type: 'IntLiteral', value: 1 },
                            }],
                          },
                        },
                      ],
                    },
                    {
                      type: 'FuncCall',
                      name: 'or',
                      arguments: [
                        { type: 'Variable', name: 'res' },
                        { type: 'Variable', name: 'n' },
                      ],
                    },
                  ],
                }],
              ],
            ),
          },
        },
      ))
    })
    describe('エラー処理', () => {
      test('実行中のエラー', () => {
        expect(evaluate(lexAndParse('def func(){ 1+true; 123; } func();'), emptyEnvironment).result.type).toBe('TypeError')
      })
    })
  })
  test('フィボナッチ', () => {
    const environment = {
      variables: new Map(),
      functions: new Map([
        ['gt', {
          type: 'EmbededFunction',
          argumentsCount: 2,
          function: (a, b) => a < b,
        }],
        ['or', {
          type: 'EmbededFunction',
          argumentsCount: 2,
          function: (a, b) => a || b,
        }],
        ['sub', {
          type: 'EmbededFunction',
          argumentsCount: 2,
          function: (a, b) => a - b,
        }],
      ]),
    }
    expect(evaluate(lexAndParse('def fib(n) { if(gt(1, n)){ ret = fib(sub(n, 1)) + fib(sub(n, 2)); } or(ret, n); } fib(20);'), environment).result).toStrictEqual(intValue(6765))
  })
})
