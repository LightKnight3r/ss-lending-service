const _ = require('lodash');

module.exports = {
  checkFieldRange: (value, valueCheck) => {
    let valid = true;

    if(!_.has(valueCheck, 'from') && !_.has(valueCheck, 'to')) {
      valid = false;
    } else {
      if(valueCheck.from && value < valueCheck.from) {
        valid = false;
      }

      if(valueCheck.to && value > valueCheck.to) {
        valid = false;
      }
    }

    return valid;
  },
  calculateDistance: (lat1, lng1, lat2, lng2) => {
    const R = 6371.008; // Radius of the earth in km
    const dLat = deg2rad(lat2-lat1);  // deg2rad below
    const dLon = deg2rad(lng2-lng1);
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return parseFloat(d.toFixed(1));
  },
  replacePhone: (text) => {
    return removePhone(text);
  }
}

function removePhone (str) {
  const arrStartedPhoneNumber = ["09", "01", "08", "02", "84", "05", "03", "07"];

  let phoneFromStr = '';

  for (var i = 0; i < arrStartedPhoneNumber.length; i++) {
    var phone = getPhoneNumberSub(str, arrStartedPhoneNumber[i]);
    if(phone != "-1" && phone != "-2" && phone.length >= 10) {
      phoneFromStr =  phone;
      break;
    }
  }

  if(phoneFromStr) {
    str = str.replace(/\+84/g, "0");
    str = str.replace(/0 /g, "0");
    var i=-1;
    while((i=str.indexOf("0",i+1)) >= 0){
        var temp = str.substring(i);
        temp = temp.replace(/[^a-zA-Z0-9]/g, "");
        if(temp.startsWith(phoneFromStr)){
            // Found phone number
            str = str.substring(0,i+phoneFromStr.length-2) + "**" +str.substring(i+phoneFromStr.length);
            return str;
        }
    }
  }

  return str;
}

function getPhoneNumberSub(str, startedpn) {
    str = str.replace(/\+84/g, "0");
    str = str.replace(/[^a-zA-Z0-9]/g, "");
    let phone = "-1";
    //alert(str);
    if(str.length < 10)
        return "-2"
    if(str.indexOf(startedpn) >= 0)
    {
        let idx = str.indexOf(startedpn);
        let iPhoneNumber = 0;
        try
        {
            phone = str.substring(idx, idx+11);
            if(isNaN(phone)) // Khong phai la so
            {
                phone = str.substring(idx, idx+10);
                iPhoneNumber = parseInt(phone);
                if(isNaN(phone))
                {
                    return getPhoneNumberSub(str.substring(idx+2), startedpn);
                }
            }
        }
        catch (e) {
            return getPhoneNumberSub(str.substring(idx+2), startedpn);
        }
    }
    return phone;
}

function isInt(value) {
    return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))
}


function deg2rad(deg) {
  return deg * (Math.PI/180)
}
