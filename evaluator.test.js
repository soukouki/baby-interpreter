/* eslint-disable no-undef */

const { evaluate } = require('./evaluator')
const { parse } = require('./parser')
const { lexicalAnalyse } = require('./lexical-analyse')
const { emptyEnvironment } = require('./value')

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
      }).result.type).toBe('EnvironmentError')
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
          type: 'Null',
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
  test('変数の参照', () => {
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
})
