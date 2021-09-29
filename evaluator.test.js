/* eslint-disable no-undef */

const { evaluate } = require('./evaluator')
const { parse } = require('./parser')
const { lexicalAnalyse } = require('./lexical-analyse')
const { emptyEnvironment, nullValue, intValue } = require('./value')

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
  })
})
