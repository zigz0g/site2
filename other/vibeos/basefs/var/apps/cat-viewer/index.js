var ui = require('/lib/ui.js');

exports.opts = {
	x: ui.align.middle, 
	y: ui.align.middle,
	offset: { x: 75, y: 0, },
	width: '600px',
	height: '400px',
	menu: {
		File: {
			Exit(window){
				window.close();
			},
		},
	},
};

exports.open = (window, data) => {
	var cat_image = window.content.append(new ui.image({
			x: ui.align.middle,
			y: 10,
			width: '75%',
			height: '75%',
			path: 'https://cataas.com/cat',
		})),
		cat_text = cat_image.append(new ui.text({
			x: ui.align.middle,
			y: ui.align.bottom,
			text: 'cool cat',
			color: '#FFF',
			size: 32,
			family: 'impact',
			weight: 'bold',
			cursor: 'text',
		})),
		cat_reload = window.content.append(new ui.button({
			x: ui.align.middle,
			y: ui.align.bottom,
			offset: {
				y: -20,
			},
			text: 'regen',
		}));

	cat_reload.on('mouseup', event => {
		cat_image.path = 'https://cataas.com/cat?' + Date.now();
		cat_image.gen();
	});
};