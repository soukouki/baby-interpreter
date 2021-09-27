exports.null = {
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
