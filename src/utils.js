function * zip (...iterables) {
  const firstIterator = iterables[0]
  for (let i = 0; i < firstIterator.length; i++) {
    const values = []
    for (const it of iterables) {
      values.push(it[i])
    }

    yield values
  }
}

module.exports = {
  zip
}
