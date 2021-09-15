/* eslint-disable no-undef */

const interpriter = require('./interpriter')

const { lexicalAnalyse } = interpriter

describe('字句解析', () => {
  test('1', () => {
    expect(lexicalAnalyse('1')).toStrictEqual([{ type: 'Int', value: 1 }])
  })
  test('123', () => {
    expect(lexicalAnalyse('123')).toStrictEqual([{ type: 'Int', value: 123 }])
  })
  test('+', () => {
    expect(lexicalAnalyse('+')).toStrictEqual([{ type: 'Add' }])
  })
  test('1+2', () => {
    expect(lexicalAnalyse('1+2')).toStrictEqual([
      { type: 'Int', value: 1 },
      { type: 'Add' },
      { type: 'Int', value: 2 }])
  })
  test('無効な文字列', () => {
    expect(lexicalAnalyse('あ')).toStrictEqual([{ type: 'UnknownCharacter', value: 'あ' }])
  })
})
