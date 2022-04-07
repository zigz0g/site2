'use strict';
var ui = require('/lib/ui.js'),
	mime = require('mime');

exports.opts = {
	x: 20,
	y: 40,
};

exports.open = (window, data) => {
	var text = window.content.append(new ui.text({
			x: ui.align.middle,
			y: ui.align.middle,
			get text(){
				return web.fps + 'FPS';
			},
			color: '#000',
			size: 24,
		})),
		alpha_getter = { get: () => window.focus ? 1 : 0.5 };
	
	Object.defineProperty(window, 'alpha', alpha_getter);
};