var linebot = require('linebot');
var express = require('express');
var getJSON = require('get-json');
var request = require("request");
var cheerio = require("cheerio");
var httpp = require("http");
require("webduino-js");
require("webduino-blockly");

var bot = linebot({
  channelId: '1524350247',
  channelSecret: '6MYFT8BngP2U/6QyTRO63TUG5BQfiiXJV7QREYPw1VPXRBN5exCzurgfRQfSt+mzX0VEUByL/9XZfAxIyTE0VAcgUes073XFbAMo+WJcAjdQ/xZpW5e1z8W0uS6AzRvTmiI40XBksRZuXn2vncCWBQdB04t89/1O/w1cDnyilFU='
});

var timer;
var jp;
var pm = [];

var botEvent;
var replyMsg;
var userId;

var deviceId = '10RrGGer';
var rgbled;
var led;

var words = [{
  "name": "pm25",
  "content": ['pm2.5', 'pm25', 'pm 2.5', 'aqi', '空氣污染', '空污', '空汙', '空氣品質', 'pm10', 'pm 10']
}, {
  "name": "pm25Location",
  "content": ['空氣監測站']
}, {
  "name": "japan",
  "content": ['日幣', '日圓', '日元']
}, {
  "name": "color",
  "content": ['紅色', '藍色', '綠色', '黃色', 'red', 'blue', 'yellow', 'green','開燈', '關燈', 'turn on', 'turn off']
}, {
  "name": "device",
  "content": ['裝置id:', '裝置 id:', 'device id:', 'deviceid:']
}, {
  "name": "online",
  "content": ['裝置連線','rgb','led']
}, {
  "name": "talk1",
  "content": ['妳好', '你好', '哈囉', 'hi', 'hello', '您好', '嗨', '好久不見']
}, {
  "name": "talk2",
  "content": ['早安', '午安', '晚安', '再見', '掰掰', 'bye', 'morning', 'night']
}, {
  "name": "talk3",
  "content": ['讚', '好棒', '厲害', '棒棒', '太神', '好強', '超棒', '帥喔']
}, {
  "name": "talk4",
  "content": ['謝謝', 'thx', 'thank', '感謝', '感恩', '感激', '謝啦']
}, {
  "name": "talk5",
  "content": ['哈哈', '嘿嘿', '喔哈', '哇哈', '嘻嘻', '呵呵', 'ㄎㄎ', '嘻哈', '揪黑', '揪嘿', '揪黑', '啾嘿', '呼呀', '呼呼']
}];
var a0 = 0;

_bot();
_preventSleeping();

const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log("App now running on port", port);
});

function _bot() {
  bot.on('message', function(event) {
    botEvent = event;
    userId = event.source.userId;
    if (event.message.type == 'text') {
      var msg0 = event.message.text;
      var msg = msg0.toLowerCase();
      replyMsg = '';
      a0 = 0;
      words.forEach(function(row) {
        row.content.forEach(function(col) {
          if (msg.indexOf(col) != -1) {
            a0 = 1;
            if (row.name == 'pm25' || row.name == 'pm25Location') {
              bot.push(userId, '資料查詢中...');
              _pm25(msg);
            } else if (row.name == 'japan') {
              bot.push(userId, '資料查詢中...');
              _japan();
            } else if (row.name == 'device') {
              _deviceId(msg0);
            } else if (row.name == 'color') {
              _webduino(msg);
            } else if (row.name == 'online') {
              _webduinoOnline(msg);
            } else if (row.name == 'talk1') {
              _talk1();
            } else if (row.name == 'talk2') {
              _talk2(msg);
            } else if (row.name == 'talk3') {
              _talk3();
            } else if (row.name == 'talk4') {
              _talk4();
            } else if (row.name == 'talk5') {
              _talk5();
            }
          }
        });
      });

      if (a0 == 0) {
        replyMsg = '不知道「' + msg0 + '」是什麼意思 :p';
        event.reply(replyMsg).then(function(data) {
          console.log(replyMsg);
        }).catch(function(error) {
          console.log('error');
        });
      }
    }
  });

}

function _pm25(msg) {
  //http://taqm.epa.gov.tw/taqm/aqs.ashx?lang=tw&act=aqi-epa
  //http://opendata2.epa.gov.tw/AQX.json
  //http://opendata.epa.gov.tw/ws/Data/REWIQA/?$orderby=SiteName&$skip=0&$top=1000&format=json
  getJSON('http://opendata.epa.gov.tw/ws/Data/REWIQA/?$orderby=SiteName&$skip=0&$top=1000&format=json', function(error, response) {
    var location = '';
    var aqi;
    response.forEach(function(e, i) {
      pm[i] = [];
      pm[i][0] = e.SiteName;
      pm[i][1] = e.AQI * 1;
      pm[i][2] = e['PM2.5'] * 1;
      pm[i][3] = e.PM10 * 1;
      pm[i][4] = e.Status;
      if (i < (response.length - 1)) {
        location = location + pm[i][0] + ' , ';
      } else {
        location = location + pm[i][0];
      }
    });
    if (msg.indexOf('空氣監測站') != -1) {
      replyMsg = location;
    } else {
      pm.forEach(function(e) {
        if (msg.indexOf(e[0]) != -1) {
          replyMsg = e[0] + '的空氣品質「' + e[4] + '」( AQI = ' + e[1] + '，PM2.5 = ' + e[2] + '，PM10 = ' + e[3] + ' )';
        }
      });
    }
    if (replyMsg == '') {
      replyMsg = '請輸入正確的地點，或輸入「空氣監測站」查詢地點';
    }
    botEvent.reply(replyMsg).then(function(data) {
      console.log(replyMsg);
    }).catch(function(error) {
      console.log('error');
    });
  });
}

function _japan() {
  request({
    url: "http://rate.bot.com.tw/Pages/Static/UIP003.zh-TW.htm",
    method: "GET"
  }, function(error, response, body) {
    if (error || !body) {
      return;
    } else {
      var $ = cheerio.load(body);
      var target = $(".rate-content-cash.text-right.print_hide");
      replyMsg = target[15].children[0].data;
      botEvent.reply(replyMsg).then(function(data) {
        console.log(replyMsg);
      }).catch(function(error) {
        console.log('error');
      });
    }
  });
}

function _deviceId(msg) {
  var d = msg.split(':')[1];
  if (d) {
    deviceId = d;
  }
  replyMsg = '新的 Device ID [ ' + d + ' ] 設定完成';
  botEvent.reply(replyMsg).then(function(data) {
    console.log(replyMsg);
  }).catch(function(error) {
    console.log('error');
  });
}

function _webduinoOnline(msg) {
  console.log(msg);
  var pin;
  var boardSetting;
  if (msg.indexOf('mark1') != -1 && msg.indexOf('led') == -1) {
    boardSetting = {
      device: deviceId
    };
    boardReady(boardSetting, function(board) {
      board.systemReset();
      board.samplingInterval = 50;
      rgbled = getRGBLedCathode(board, 9, 10, 11);
      replyMsg = '馬克一號裝置已上線 ( ' + deviceId + ' )，設定三色燈腳位 9,10,11';
      botEvent.reply(replyMsg).then(function(data) {
        console.log(replyMsg);
      }).catch(function(error) {
        console.log('error');
      });
    });
  } else if (msg.indexOf('mark1') != -1 && msg.indexOf('led') != -1) {
    boardSetting = {
      device: deviceId
    };
    boardReady(boardSetting, function(board) {
      board.systemReset();
      board.samplingInterval = 50;
      led = getLed(board, 10);
      replyMsg = '馬克一號裝置已上線 ( ' + deviceId + ' )，設定 led 腳位 10';
      botEvent.reply(replyMsg).then(function(data) {
        console.log(replyMsg);
      }).catch(function(error) {
        console.log('error');
      });
    });
  } else {
    boardSetting = {
      board: 'Smart',
      device: deviceId,
      transport: 'mqtt'
    };
    boardReady(boardSetting, function(board) {
      board.systemReset();
      board.samplingInterval = 50;
      rgbled = getRGBLedCathode(board, 15, 12, 13);
      replyMsg = 'Smart 裝置已上線 ( ' + deviceId + ' )，設定三色燈腳位 15,12,13';
      botEvent.reply(replyMsg).then(function(data) {
        console.log(replyMsg);
      }).catch(function(error) {
        console.log('error');
      });
    });
  }
}

function _webduino(msg) {
  if (msg.indexOf('黃色') != -1 || msg.indexOf('yellow') != -1) {
    rgbled.setColor('#ffff00');
    replyMsg = '已經發出黃色光';
  } else if (msg.indexOf('紅色') != -1 || msg.indexOf('red') != -1) {
    rgbled.setColor('#ff0000');
    replyMsg = '已經發出紅色光...';
  } else if (msg.indexOf('綠色') != -1 || msg.indexOf('green') != -1) {
    rgbled.setColor('#00ff00');
    replyMsg = '已經發出綠色光';
  } else if (msg.indexOf('藍色') != -1 || msg.indexOf('blue') != -1) {
    rgbled.setColor('#0000ff');
    replyMsg = '已經發出藍色光';
  } else if (msg.indexOf('開燈') != -1 || msg.indexOf('turn on') != -1) {
    led.on();
    replyMsg = '開燈囉！';
  } else if (msg.indexOf('關燈') != -1 || msg.indexOf('turn off') != -1) {
    led.off();
    replyMsg = '關起來了！';
  }
  botEvent.reply(replyMsg).then(function(data) {
    console.log(replyMsg);
  }).catch(function(error) {
    console.log('error');
  });
}



var all1 = ['你好，', '您好，', '哈囉，', 'Hi~', 'Hello~', '嗨嗨，'];
var all2 = ['請問有事嗎？', '有什麼我可以服務的嗎？', '有事找我嗎？', '有什麼事嗎？', '需要我幫忙什麼嗎？', '想聊聊嗎？'];
var all3 = ['謝謝啦！', '謝謝稱讚！', '謝謝你！'];
var all4 = ['不客氣~', '過獎啦！', '哪裡哪裡~'];
var all5 = ['呵呵', '嘿嘿', 'ㄎㄎ', '嘻嘻', '喔哈', '^_^', '|O|', '啾嘿', '呼呀'];

function _talk1() {

  var reply1 = all1;
  var reply2 = all2;
  var r1 = Math.floor(Math.random() * (reply1.length));
  var r2 = Math.floor(Math.random() * (reply2.length));

  replyMsg = reply1[r1] + reply2[r2];

  botEvent.reply(replyMsg).then(function(data) {
    console.log(replyMsg);
  }).catch(function(error) {
    console.log('error');
  });
}

function _talk2(msg) {
  var reply1 = all1;
  var reply2 = all2;
  if (msg.indexOf('早安') != -1) {
    reply1 = reply1.concat(['早安，', '早安呦！', '早安您好，', '早上好，']);
  } else if (msg.indexOf('午安') != -1) {
    reply1 = reply1.concat(['午安，', '午安您好，', '午安呦！']);
  } else if (msg.indexOf('晚安') != -1) {
    reply1 = reply1.concat(['晚安，', '晚安您好，', '晚安呦！']);
  } else if (msg.indexOf('再見') != -1 || msg.indexOf('掰掰') != -1 || msg.indexOf('bye') != -1) {
    reply1 = ['再見囉！', '再會啦！', 'Bye~', '掰掰！'];
    reply2 = ['有事再找我喔！', '祝你一切順心~', '有問題再找我~ ^_^', '有空再聊~'];
  }

  var r1 = Math.floor(Math.random() * (reply1.length));
  var r2 = Math.floor(Math.random() * (reply2.length));
  replyMsg = reply1[r1] + reply2[r2];

  botEvent.reply(replyMsg).then(function(data) {
    console.log(replyMsg);
  }).catch(function(error) {
    console.log('error');
  });
}

function _talk3() {

  var reply1 = all3;
  var r1 = Math.floor(Math.random() * (reply1.length));

  replyMsg = reply1[r1];

  botEvent.reply(replyMsg).then(function(data) {
    console.log(replyMsg);
  }).catch(function(error) {
    console.log('error');
  });
}

function _talk4() {

  var reply1 = all4;
  var r1 = Math.floor(Math.random() * (reply1.length));

  replyMsg = reply1[r1];

  botEvent.reply(replyMsg).then(function(data) {
    console.log(replyMsg);
  }).catch(function(error) {
    console.log('error');
  });
}

function _talk5() {

  var reply1 = all5;
  var r1 = Math.floor(Math.random() * (reply1.length));

  replyMsg = reply1[r1];

  botEvent.reply(replyMsg).then(function(data) {
    console.log(replyMsg);
  }).catch(function(error) {
    console.log('error');
  });
}

function _preventSleeping() {
  clearTimeout(timer);
  httpp.get('http://oxxolinebot.herokuapp.com/');
  console.log('awake');
  timer = setInterval(_preventSleeping, 300000);
}
