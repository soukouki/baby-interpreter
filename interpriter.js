/* eslint-disable no-console */

const util = require('util')
const prompts = require('prompts')
const { lexicalAnalyse } = require('./lexical-analyse')
const { parse } = require('./parser')
const { evaluate } = require('./evaluator')

async function read() {
  const result = await prompts({
    type: 'text',
    name: 'value',
    message: '',
  })
  return result.value
}

function stringify(obj) {
  return util.inspect(obj, false, null, true)
}

let environment = {
  variables: new Map(),
  functions: new Map([
    ['print', {
      type: 'EmbededFunction',
      argumentsCount: 1,
      function: console.log,
    }],
  ]),
};

(async () => {
  const { mode } = await prompts({
    type: 'select',
    name: 'mode',
    message: 'Choose mode',
    choices: [
      { title: 'only lexical analyse', value: 'LexicalAnalyse' },
      { title: 'lexical analyse and parse', value: 'Parse' },
      { title: 'lexical analyse, parse, and evaluate', value: 'Evaluate' },
    ],
    initial: 2,
  })
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const source = await read()
    if (source === undefined) break
    const tokens = lexicalAnalyse(source)
    const lexicalError = tokens.find((token) => token.type === 'UnknownCharacter')
    if (lexicalError) {
      console.error(stringify(lexicalError))
      continue
    }
    if (mode === 'LexicalAnalyse') {
      console.log(stringify(tokens))
      continue
    }
    const ast = parse(tokens)
    if (ast.type === 'SyntaxError') {
      console.error(stringify(ast))
      continue
    }
    if (mode === 'Parse') {
      console.log(stringify(ast))
      continue
    }
    const resultObject = evaluate(ast, environment)
    if (resultObject.result.isError) {
      console.error(stringify(resultObject))
      continue
    }
    console.log(stringify(resultObject.result))
    environment = resultObject.environment
  }
})()
