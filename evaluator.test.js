/* eslint-disable no-undef */

const { evaluate } = require('./evaluator')
const { parse } = require('./parser')
const { lexicalAnalyse } = require('./lexical-analyse')

function lexAndParse(source) {
  return parse(lexicalAnalyse(source))
}

const emptyEnvironment = {
  variables: new Map(),
  functions: new Map(),
}

describe('評価', () => {
  test('1', () => {
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
    expect(evaluate(lexAndParse('123'), emptyEnvironment)).toStrictEqual(
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
  test('1+2', () => {
    expect(evaluate(lexAndParse('1+2'), emptyEnvironment)).toStrictEqual(
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
})
