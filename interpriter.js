/* eslint-disable no-continue */
/* eslint-disable no-console */

const prompts = require('prompts')
const { emptyEnvironment } = require('./value')
const { lexicalAnalyse } = require('./lexical-analyse')
const { parse } = require('./parser')
const { evaluate } = require('./evaluator')

async function read() {
  const respond = await prompts({
    type: 'text',
    name: 'value',
    message: '',
  })
  return respond.value
}

(async () => {
  let environment = emptyEnvironment
  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const tokens = lexicalAnalyse(await read())
    const lexicalError = tokens.find((token) => token.type === 'UnknownCharacter')
    if (lexicalError) {
      console.error(lexicalError)
      continue
    }
    const ast = parse(tokens)
    if (ast.type === 'SyntaxError') {
      console.error(ast)
      continue
    }
    const resultObject = evaluate(ast, environment)
    if (resultObject.result.isError) {
      console.error(resultObject)
      continue
    }
    console.log(resultObject.result)
    environment = resultObject.environment
  }
})()
