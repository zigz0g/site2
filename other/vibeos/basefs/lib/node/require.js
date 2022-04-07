'use strict';
var path = require('path'),
	mime = require('mime'),
	buffer = require('buffer'),
	web = {};

exports.cache = {};

/**
* @param {object} fs filesystem to read and search from
* @param {object} base_dir directory that non-absolute paths are resolved from
* @param {object} user user account to assign to output
* @property {object} user user account data
* @property {function} exec execute scripts
* @example
* // returns ƒ require(){...}
* 
* var fs = require('fs').mount('/', 'object', base_fs_data),
* 	crequire = require('require'),
* 	cvrequire = crequire.init(fs, '/');
* 
* console.log(cvrequire);
* @return {function} require
*/

exports.init = (fs, base_dir, user) => {
	var require = (dire, options) => {
		var file = path.resolve(dire);
		
		if(!path.isAbsolute(dire) && exports.cache[dire])return exports.cache[dire];
		
		// add js extension if missing
		if(!path.extname(file))file = file + '.js';
		
		if(!fs.existsSync(file))file = path.join(base_dir, file);
		
		if(!fs.existsSync(file))throw new TypeError('Cannot find module \'' + file + '\'');
		
		if(exports.cache[file])return exports.cache[file];
		
		return require.exec(fs, file, options).init();
	};
	
	require.user = { name: '', home: '' };
	
	/**
	* @param {string} fs filesystem to read/write from
	* @param {string} file filename of script being executed
	* @param {object} options options when processing
	* @param {object} options.cache if the output should be added to cache
	* @param {object} options.args additional args to pass to function
	* @example
	* // returns object
	* console.log(cvrequire.exec(fs.readFileSync('/lib/node/events.js', 'utf8'), 'events'));
	* console.log(crequire.cache); // added to cache
	* @return {function} exec
	*/
	
	require.exec = (fs, file, options = {}) => {
		if(mime.getType(file) == 'application/json')return JSON.parse(fs.readFileSync(file, 'utf8'));
		
		options = Object.assign({
			cache: true,
			args: {},
			func: Function,
		}, options);
		
		var args = Object.assign({
				module: {
					get exports(){
						return args.exports;
					},
					set exports(v){
						return args.exports = v;
					},
				},
				exports: {},
				require: exports.init(fs, path.dirname(file), require.user),
				Buffer: buffer.Buffer,
				process: Object.assign(process, {
					pid: process.last_pid + 1,
					platform:'linux',
					arch: 'x32',
					cwd:_=> path.dirname(file),
				}),
				__filename: file,
				__dirname: path.dirname(file),
				web: web,
				global: web,
				// proxy later
				fetch: fetch,
				user: require.user,
			}, options.args),
			script = fs.readFileSync(file, 'utf8');
		
		args.require.user = require.user;
		
		return {
			args: args,
			init(){
				var func = new options.func(Object.keys(args), '//# sourceURL=' + file + '\n' + script);
				
				Reflect.apply(func, args.exports, Object.values(args));
				
				return options.cache ? exports.cache[file] = args.exports : args.exports;
			},
		};
	};
	
	return require;
};