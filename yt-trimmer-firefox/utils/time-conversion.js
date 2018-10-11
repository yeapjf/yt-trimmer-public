// Function which converts time from string of <hh:mm:ss> format.
if (typeof timeToSec === 'undefined') {
  function timeToSec(time, maxLength) {
    let seconds = NaN;
    let timeSeg = time.split(':').reverse();
    let numSeg  = timeSeg.length;

    if (numSeg < 4) {
      for (let i = 0; i < numSeg; i ++) {
        if (i === 0) {
          let num = parseFloat(timeSeg[i]);
          if (numSeg > 1 && num < 60) seconds = num;
          else if (numSeg === 1) seconds = num;
          else seconds = NaN;
        }
        else if (i === 1) {
          let num = parseInt(timeSeg[i]);
          if (numSeg > 2 && num < 60) seconds += num * 60;
          else if (numSeg === 2) seconds += num * 60;
          else seconds = NaN;
        }
        else if (i === 2) {
          let num = parseInt(timeSeg[i]);
          seconds += num * 3600;
        }
      }
    }
    if (seconds > maxLength) seconds = maxLength;
    seconds = niceRound(seconds, 1);
    return seconds;
  }
};

// Function which converts seconds into string of <(hh):mm:ss> format.
if (typeof secToTime === 'undefined') {
  function secToTime(seconds) {
    let time = null;
    let hour = 0 | seconds / 3600;
    seconds -= hour * 3600;
    let min  = 0 | seconds / 60;
    let sec  = Math.round(seconds % 60);

    if (String(sec).length < 2) sec = '0' + sec;
    if (hour) {
      if (String(min).length < 2) min = '0' + min;
      time = hour + ':' + min + ':' + sec;
    }
    else time = min + ':' + sec;
    return time;
  }
};

function niceRound(seconds, dp) {
  let rounded = +(Math.round(seconds + 'e+' + dp)  + 'e-' + dp);
  if (rounded === +rounded  && rounded === (rounded | 0))
    rounded = parseInt(rounded);
  return rounded;
}
