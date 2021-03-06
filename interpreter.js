/* eslint-disable no-console */

const util = require('util')
const fs = require('fs')
const prompts = require('prompts')
const { lexicalAnalyze } = require('./lexical-analyze')
const { parse } = require('./parser')
const { evaluate } = require('./evaluator')
const { intValue } = require('./value')

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
  variables: new Map([
    ['zero', {
      value: intValue(0),
    }],
  ]),
  functions: new Map([
    ['print', {
      type: 'EmbeddedFunction',
      argumentsCount: 1,
      function: console.log,
    }],
  ]),
}

function checkLexicalError(tokens) {
  tokens.find((token) => token.type === 'UnknownCharacter')
}

async function interrupt() {
  const { mode } = await prompts({
    type: 'select',
    name: 'mode',
    message: 'Choose mode',
    choices: [
      { title: 'only lexical analyze', value: 'LexicalAnalyze' },
      { title: 'lexical analyze and parse', value: 'Parse' },
      { title: 'lexical analyze, parse, and evaluate', value: 'Evaluate' },
    ],
    initial: 2,
  })
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const source = await read()
    if (source === undefined) break
    const tokens = lexicalAnalyze(source)
    const lexicalError = checkLexicalError(tokens)
    if (lexicalError) {
      console.error(stringify(lexicalError))
      continue
    }
    if (mode === 'LexicalAnalyze') {
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
    if (resultObject.error) {
      console.error(stringify(resultObject))
      continue
    }
    console.log(stringify(resultObject.result))
    environment = resultObject.environment
  }
}

async function evaluateFile(path) {
  const source = await fs.readFileSync(path, 'utf-8')

  const tokens = lexicalAnalyze(source)
  const lexicalError = checkLexicalError(tokens)
  if (lexicalError) {
    console.error(stringify(lexicalError))
    return
  }
  const ast = parse(tokens)
  if (ast.type === 'SyntaxError') {
    console.error(stringify(ast))
    return
  }
  const resultObject = evaluate(ast, environment)
  if (resultObject.error) {
    console.error(stringify(resultObject))
  }
}

(async () => {
  if (process.argv[2]) {
    await evaluateFile(process.argv[2])
  } else {
    await interrupt()
  }
})()
