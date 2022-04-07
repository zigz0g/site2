var fs = require('fs'),
	ui = require('/lib/ui.js'),
	screen = require('/lib/screen.js');

exports.opts = {
	x: ui.align.middle, 
	y: ui.align.middle,
	width: '600px',
	height: '400px',
	menu: {
		File: {
			Exit(window){
				window.close();
			},
			Open(window){
				
			},
		},
		Edit: {
			Open(window){
				
			},
		},
		Help: {
			'About Notepad'(window){
				if(!window.help || window.help.deleted)window.help = screen.layers.append(ui.template('about', 'notepad'));
				
				window.help.bring_front();
			},
		},
	},
};

exports.open = (window, data) => {
	var margin = 6,
		text = {
			scroll: window.content.append(new ui.scroll_box({
				width: '100%',
				height: '100%',
				get inner_height(){
					return text.elem.height;
				},
			})),
			elem: new ui.text({
				text: '',
				color: '#000',
				offset: {
					width: margin * -2,
					height: margin * -2,
					x: margin,
					y: margin,
				},
				wrap: true,
				cursor: 'text',
			}),
			open_file(loc){
				if(!fs.existsSync(loc))return;
				
				window.title = 'Text Editor - ' + loc;
				
				var utf8 = fs.readFileSync(loc, 'utf8');
				
				text.elem.text = utf8;
			}
		};

	text.scroll.content.append(text.elem);

	if(data.file)text.open_file(data.file);
};