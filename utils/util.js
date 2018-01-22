const momemt = require('moment');

exports.random = (startNumber, endNumber) => {
  return Math.round(Math.random() * (endNumber - startNumber) + startNumber);
};

const formatDate = seconds => {
  const duration = momemt.duration(seconds, 's');
  let output = '';

  if (duration.as('s') < 60) {
    output = Math.floor(duration.as('s')) + ' 秒';
  }
  else if (duration.as('m') < 60) {
    const minutes = duration.as('m');
    output = Math.floor(minutes) + ' 分钟';
    output += formatDate((minutes - Math.floor(minutes)) * 60);
  }
  else if (duration.as('h') < 24) {
    const hours = duration.as('h');
    output = Math.floor(hours) + ' 小时';
    output += formatDate((hours - Math.floor(hours)) * 60 * 60);
  }
  else {
    const day = duration.as('d');
    output = Math.floor(day) + ' 天';
    output += formatDate((day - Math.floor(day)) * 24 * 60 * 60);
  }

  return output;
};

exports.formatDate = formatDate;