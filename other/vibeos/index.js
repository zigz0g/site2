'use strict';
var path = require('path'),
	Builder = require('./build'),
	builder = new Builder(Object.assign(require('./build.json')), path.join(__dirname, 'basefs'), path.join(__dirname, 'dist'));

// watch changes
builder.watch(build => {
	console.log('Building..');
	
	build.then(() => {
		console.log('Build finish');
	});
});