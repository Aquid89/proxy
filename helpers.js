const timeToStringLocal = (time, localtime) => {
    const offsetString = decodeURIComponent(localtime) 
    const offset = parseInt(offsetString, 10)
    const date = new Date(time)
    date.setUTCHours(date.getUTCHours() + offset)

    const pad = (num) => (num < 10 ? `0${num}` : num)
    const formattedDate =
      pad(date.getUTCDate()) +
      '.' +
      pad(date.getUTCMonth() + 1) +
      '.' +
      date.getUTCFullYear() +
      ' ' +
      pad(date.getUTCHours()) +
      ':' +
      pad(date.getUTCMinutes()) +
      ':' +
      pad(date.getUTCSeconds());

    return formattedDate
}

module.exports = {
    timeToStringLocal
}