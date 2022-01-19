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
        partsOfSource: [{ type: 'UnknownAST' }],
      }, emptyEnvironment).error.type).toBe('EvaluatorError')
    })
  })
  describe('各種リテラル', () => {
    test('整数', () => {
      expect(evaluate(lexAndParse('123;'), emptyEnvironment).result).toStrictEqual(
        {
          type: 'IntValue',
          value: 123,
        },
      )
    })
    describe('真偽値', () => {
      test('true', () => {
        expect(evaluate(lexAndParse('true;'), emptyEnvironment).result).toStrictEqual(
          {
            type: 'BoolValue',
            value: true,
          },
        )
      })
      test('false', () => {
        expect(evaluate(lexAndParse('false;'), emptyEnvironment)).toStrictEqual(
          {
            result: {
              type: 'BoolValue',
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
          },
          environment: emptyEnvironment,
        },
      )
    })
  })
  describe('足し算', () => {
    test('1+2;', () => {
      expect(evaluate(lexAndParse('1+2;'), emptyEnvironment)).toStrictEqual(
        {
          result: intValue(3),
          environment: emptyEnvironment,
        },
      )
    })
    test('型エラー', () => {
      expect(evaluate(lexAndParse('a+1;'), {
        variables: new Map([['a', { type: 'NullValue' }]]),
        functions: new Map(),
      }).error.type).toBe('TypeError')
    })
    test('エラー時にエラーを上げていく処理', () => {
      expect(evaluate(lexAndParse('(1+non)+23;'), emptyEnvironment).error.type).toBe('TypeError')
      expect(evaluate(lexAndParse('1+(non+23);'), emptyEnvironment).error.type).toBe('TypeError')
    })
  })
  test('複数の文', () => {
    expect(evaluate(lexAndParse('1;2;'), emptyEnvironment)).toStrictEqual(
      {
        result: intValue(2),
        environment: emptyEnvironment,
      },
    )
  })
  test('代入文', () => {
    expect(evaluate(lexAndParse('a=1;'), emptyEnvironment)).toStrictEqual(
      {
        result: nullValue,
        environment: {
          variables: new Map([
            ['a', {
              value: {
                type: 'IntValue',
                value: 1,
              },
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
            value: intValue(123),
          }],
        ]),
        functions: new Map(),
      })).toStrictEqual(
        {
          result: intValue(123),
          environment: {
            variables: new Map([
              ['value', {
                value: intValue(123),
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
          result: nullValue,
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
            ['a', {
              value: intValue(1),
            }],
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
            ['a', {
              value: intValue(1),
            }],
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
        expect(evaluate(lexAndParse('if(1+true){ }'), emptyEnvironment).error.type).toBe('TypeError')
      })
      test('実行部分でエラー', () => {
        expect(evaluate(lexAndParse('if(true){ 1+true; 1234; }'), emptyEnvironment).error.type).toBe('TypeError')
      })
    })
  })
  describe('組み込み関数', () => {
    test('組み込み関数が呼べることの確認', () => {
      const embeddedFunction = jest.fn()
      const environmentWithEmbeddedFunction = {
        variables: new Map(),
        functions: new Map([
          ['embedded', {
            type: 'EmbeddedFunction',
            argumentsCount: 0,
            function: embeddedFunction,
          }],
        ]),
      }
      expect(evaluate(lexAndParse('embedded();'), environmentWithEmbeddedFunction)).toStrictEqual(
        {
          result: nullValue,
          environment: environmentWithEmbeddedFunction,
        },
      )
      expect(embeddedFunction.mock.calls).toEqual([[]])
    })
    describe('組み込み関数に引数を渡せることの確認', () => {
      test('整数', () => {
        const embeddedFunction = jest.fn()
        const environmentWithEmbeddedFunction = {
          variables: new Map(),
          functions: new Map([
            ['embedded', {
              type: 'EmbeddedFunction',
              argumentsCount: 1,
              function: embeddedFunction,
            }],
          ]),
        }
        expect(evaluate(lexAndParse('embedded(123);'), environmentWithEmbeddedFunction)).toStrictEqual(
          {
            result: nullValue,
            environment: environmentWithEmbeddedFunction,
          },
        )
        expect(embeddedFunction.mock.calls).toEqual([[123]])
      })
      test('真偽値', () => {
        const embeddedFunction = jest.fn()
        const environmentWithEmbeddedFunction = {
          variables: new Map(),
          functions: new Map([
            ['embedded', {
              type: 'EmbeddedFunction',
              argumentsCount: 2,
              function: embeddedFunction,
            }],
          ]),
        }
        expect(evaluate(lexAndParse('embedded(true, false);'), environmentWithEmbeddedFunction)).toStrictEqual(
          {
            result: nullValue,
            environment: environmentWithEmbeddedFunction,
          },
        )
        expect(embeddedFunction.mock.calls).toEqual([[true, false]])
      })
      test('null', () => {
        const embeddedFunction = jest.fn()
        const environmentWithEmbeddedFunction = {
          variables: new Map(),
          functions: new Map([
            ['embedded', {
              type: 'EmbeddedFunction',
              argumentsCount: 2,
              function: embeddedFunction,
            }],
          ]),
        }
        expect(evaluate(lexAndParse('embedded(null, 1+2);'), environmentWithEmbeddedFunction)).toStrictEqual(
          {
            result: nullValue,
            environment: environmentWithEmbeddedFunction,
          },
        )
        expect(embeddedFunction.mock.calls).toEqual([[null, 3]])
      })
    })
    describe('組み込み関数から値が返ることの確認', () => {
      const embeddedFunction = jest.fn()
      const environmentWithEmbeddedFunction = {
        variables: new Map(),
        functions: new Map([
          ['embedded', {
            type: 'EmbeddedFunction',
            argumentsCount: 0,
            function: embeddedFunction,
          }],
        ]),
      }
      test('整数', () => {
        embeddedFunction.mockReturnValue(123)
        expect(evaluate(lexAndParse('embedded();'), environmentWithEmbeddedFunction)).toStrictEqual(
          {
            result: intValue(123),
            environment: environmentWithEmbeddedFunction,
          },
        )
        expect(embeddedFunction).toHaveBeenCalled()
      })
      describe('真偽値', () => {
        test('true', () => {
          embeddedFunction.mockReturnValue(true)
          expect(evaluate(lexAndParse('embedded();'), environmentWithEmbeddedFunction)).toStrictEqual(
            {
              result: boolValue(true),
              environment: environmentWithEmbeddedFunction,
            },
          )
          expect(embeddedFunction).toHaveBeenCalled()
        })
        test('false', () => {
          embeddedFunction.mockReturnValue(false)
          expect(evaluate(lexAndParse('embedded();'), environmentWithEmbeddedFunction)).toStrictEqual(
            {
              result: boolValue(false),
              environment: environmentWithEmbeddedFunction,
            },
          )
          expect(embeddedFunction).toHaveBeenCalled()
        })
      })
      test('null', () => {
        embeddedFunction.mockReturnValue(null)
        expect(evaluate(lexAndParse('embedded();'), environmentWithEmbeddedFunction)).toStrictEqual(
          {
            result: nullValue,
            environment: environmentWithEmbeddedFunction,
          },
        )
        expect(embeddedFunction).toHaveBeenCalled()
      })
    })
    test('引数でエラーが起きたときの処理', () => {
      const functionDefinedEnvironment = {
        variables: new Map(),
        functions: new Map([['func', { type: 'EmbeddedFunction', argumentsCount: 1 }]]),
      }
      expect(evaluate(lexAndParse('func(1+null);'), functionDefinedEnvironment).error.type).toBe('TypeError')
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
      expect(evaluate(lexAndParse('def func() { 123; } func();'), emptyEnvironment).result).toStrictEqual(
        intValue(123),
      )
    })
    test('定義した関数に引数を付けて呼べることの確認', () => {
      expect(evaluate(lexAndParse('def func(abc) { abc; } func(123);'), emptyEnvironment).result).toStrictEqual(
        intValue(123),
      )
    })
    test('定義した関数と環境が違うことの確認', () => {
      expect(evaluate(lexAndParse('abc = 123; def func() { abc=456; } func(); abc;'), emptyEnvironment).result).toStrictEqual(
        intValue(123),
      )
    })
    test('定義した関数の仮引数と環境が違うことの確認', () => {
      expect(evaluate(lexAndParse('abc = 123; def func(abc) { } func(456); abc;'), emptyEnvironment).result).toStrictEqual(
        intValue(123),
      )
    })
    test('定義した関数の中で関数を呼べることの確認', () => {
      expect(evaluate(lexAndParse('def a(){b();} def b(){123;} a();'), emptyEnvironment).result).toStrictEqual(
        intValue(123),
      )
    })
    test('定義した関数の中で自身の関数を呼べることの確認', () => {
      const embeddedFunctions = [
        ['notequal', {
          type: 'EmbeddedFunction',
          argumentsCount: 2,
          function: (a, b) => a !== b,
        }],
        ['or', {
          type: 'EmbeddedFunction',
          argumentsCount: 2,
          function: (a, b) => a || b,
        }],
      ]
      const definedEmbeddedFunctionEnvironment = {
        variables: new Map(),
        functions: new Map(embeddedFunctions),
      }
      expect(evaluate(
        lexAndParse('def func(n) { if(notequal(n, 5)) { res = func(n+1); } or(res, n); } func(0);'),
        definedEmbeddedFunctionEnvironment,
      ).result).toEqual(
        intValue(5),
      )
    })
    describe('エラー処理', () => {
      test('実行中のエラー', () => {
        expect(evaluate(lexAndParse('def func(){ 1+true; 123; } func();'), emptyEnvironment).error.type).toBe('TypeError')
      })
    })
  })
  test('フィボナッチ数列', () => {
    const environment = {
      variables: new Map(),
      functions: new Map([
        ['gt', {
          type: 'EmbeddedFunction',
          argumentsCount: 2,
          function: (a, b) => a < b,
        }],
        ['or', {
          type: 'EmbeddedFunction',
          argumentsCount: 2,
          function: (a, b) => a || b,
        }],
        ['sub', {
          type: 'EmbeddedFunction',
          argumentsCount: 2,
          function: (a, b) => a - b,
        }],
      ]),
    }
    expect(evaluate(lexAndParse('def fib(n) { if(gt(1, n)){ ret = fib(sub(n, 1)) + fib(sub(n, 2)); } or(ret, n); } fib(10);'), environment).result).toStrictEqual(intValue(55))
  })
})
