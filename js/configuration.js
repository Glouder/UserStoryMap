var argv = require('yargs')
        .usage('Usage: $0 [--port INTEGER [50555]] [--baseurl STRING ["/"]] [--redis STRING:INT [127.0.0.1:6379]] [--gaEnabled] [--gaAccount STRING [UA-2069672-4]]')
        .argv;

exports.server = {
	port: argv.port || 50555,
	baseurl: argv.baseurl || '/'
};

exports.database = {
	type: 'redis',
	prefix: '#userMapStory#',
	//redis: argv.redis || '127.0.0.1:6379'
	redis: argv.redis || 'redis://127.0.0.1:6379'
};

//exports.googleanalytics = {
//	enabled: argv['gaEnabled'] || false,
//	account: argv['gaAccount'] || "UA-2069672-4"
//};
