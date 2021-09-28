exports.nullValue = {
  type: 'Null',
  isError: false,
}

exports.intValue = function (value) {
  return {
    type: 'IntValue',
    isError: false,
    value,
  }
}

exports.emptyEnvironment = {
  variables: new Map(),
  functions: new Map(),
}
