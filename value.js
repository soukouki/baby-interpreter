exports.nullValue = {
  type: 'NullValue',
  isError: false,
}

exports.intValue = function (value) {
  return {
    type: 'IntValue',
    isError: false,
    value,
  }
}

exports.boolBalue = function (value) {
  return {
    type: 'BoolValue',
    isError: false,
    value,
  }
}

exports.emptyEnvironment = {
  variables: new Map(),
  functions: new Map(),
}
