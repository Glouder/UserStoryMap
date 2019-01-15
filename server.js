var sanitizer = require('sanitizer');
var compression = require('compression');
var express = require('express');
var config = require('./configuration.js').server;
var googleanalytics = require('./configuration.js').googleanalytics;
//var workspace = require('./workspace.js');
//var data = require('./database.js').db;

//用户名的标识SID
var UserSID = [];

var app = express();
var router = express.Router();

app.use(compression());
app.use(config.baseurl, router)

//app.locals.googleanalytics = googleanalytics.enabled;
//app.locals.gaAccount = googleanalytics.account;

//访问client中的文件
router.use(express.static(__dirname + '/'));
//创建express服务器，端口号为config.js中设置的8080
var server = require('http').Server(app);
server.listen(config.port);

var SocketIo = require('socket.io')(server, {
	path: config.baseurl == '/' ? '' : config.baseurl + "/socket.io"
});

//地址为127.0.0.1:8080/demo，显示的界面为用户故事画板
router.get('/demo', function(req, res) {
	res.render('index.html', {
		pageTitle: 'userMapStory',
		demo: true
	});
});

SocketIo.sockets.on('connection', function(client) {
	function scrub(message) {
		if(typeof message != "undefined" && message != null) {
			return sanitizer.sanitize(message);
		} else {
			return null;
		}
	}

	client.on('message', function(message) {
		var managedData = {};
		var managedMessage = {};
		var sendMessage = {};

		if(message.action == null) {
			return;
		}

		switch(message.action) {

			//移动卡片
			case 'moveCard':
				sendMessage = {
					action: message.action,
					data: {
						id: scrub(message.data.id),
						position: {
							left: scrub(message.data.position.left),
							top: scrub(message.data.position.top)
						}
					}
				};

				break;

				//创建卡片
			case 'createCard':
				data = message.data;
				managedData = {};
				managedData.text = scrub(data.text);
				managedData.id = scrub(data.id);
				managedData.x = scrub(data.x);
				managedData.y = scrub(data.y);
				managedData.colour = scrub(data.colour);

				sendMessage = {
					action: 'createCard',
					data: managedData
				};
				break;

			case 'editCard':

				managedData = {};
				managedData.value = scrub(message.data.value);
				managedData.id = scrub(message.data.id);

				sendMessage = {
					action: 'editCard',
					data: managedData
				};
				break;

			case 'deleteCard':
				managedMessage = {
					action: 'deleteCard',
					data: {
						id: scrub(message.data.id)
					}
				};

				break;

			case 'createColumn':
				managedMessage = {
					data: scrub(message.data)
				};

				break;


			case 'setBoardSize':

				var size = {};
				size.width = scrub(message.data.width);
				size.height = scrub(message.data.height);

				getRoom(client, function(room) {
					db.setBoardSize(room, size);
				});

				broadcastToRoom(client, {
					action: 'setBoardSize',
					data: size
				});
				break;

			default:
				//console.log('unknown action');
				break;
		}
	})
})


function createCard( room, id, text, x, y, colour ) {
	var card = {
		id: id,
		colour: colour,
		x: x,
		y: y,
		text: text,
		sticker: null
	};
}

function roundRand( max )
{
	return Math.floor(Math.random() * max);
}

function cleanAndInitializeDemoRoom()
{
		createCard('/demo', 'card1', 'yellow', roundRand(600), roundRand(300),'yellow');
		createCard('/demo', 'card2', 'white', roundRand(600), roundRand(300),'white');
		createCard('/demo', 'card3', 'blue', roundRand(600), roundRand(300),'blue');
		createCard('/demo', 'card4', 'green', roundRand(600), roundRand(300),'green');
		createCard('/demo', 'card5', 'yellow', roundRand(600), roundRand(300),'yellow');
		createCard('/demo', 'card6', 'yellow', roundRand(600), roundRand(300),'yellow');
		createCard('/demo', 'card7', 'blue', roundRand(600), roundRand(300),'blue');
		createCard('/demo', 'card8', 'green', roundRand(600), roundRand(300),'green');
}


cleanAndInitializeDemoRoom();

