var fs = require('fs'),
	path = require('path'),
	dom_utils = require('/lib/dom-utils.js');

module.exports = file => {
	file = path.resolve(file);
	
	// add js extension if missing
	if(!path.extname(file))file = file + '.js';
	
	if(!fs.existsSync(file))file = path.join(base_dir, file);
	
	if(!fs.existsSync(file))throw new TypeError('Cannot find file \'' + file + '\'');
	
	return module.exports.exec(fs, file);
};

module.exports.exec = (fs, file) => {
	var frame = dom_utils.add_ele('iframe', document.body, { style: 'display:none' }),
		script = fs.readFileSync(file, 'utf8'),
		exec = require.exec(fs, file, { func: frame.contentWindow.Function });

	Object.assign(exec.args.process, {
		ppid: process.pid,
		pid: process.last_pid += 1,
	});
};