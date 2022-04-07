var path = require('path'),
	Buffer = require('buffer').Buffer,
	fs = require('fs').mount('/', 'object', a),
	init_require = require('require'),
	_require = init_require.init(fs, '/');

document.body.innerHTML = '';

init_require.cache = {
	fs: fs,
	path: path,
	mime: require('mime'),
	buffer: require('Buffer'),
	events: _require.exec(fs, '/lib/node/events.js').init(),
};

_require.user = {
	alias: 'root',
	home: '/root',
};

_require('/boot/init.js');