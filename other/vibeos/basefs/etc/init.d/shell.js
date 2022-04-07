var fs = require('fs'),
	ui = require('/lib/ui'),
	screen = require('/lib/screen');

new FontFace('vga', fs.readFileSync('/usr/local/share/fonts/vga.ttf')).loaded.then(font => {
	screen.render();
	screen.state = 'shell';
	
	document.fonts.add(font);
	
	var shell = screen.layers.append(new ui.text({
		family: 'vga',
		text: 'vibeOS Shell\n',
		wrap: false,
		width: '100%',
		height: '100%',
		cursor: 'text',
		size: 16,
	}));
	
	screen.is_terminal = false;

	screen.keyboard.on('keyup', event => {
		if(event.func && screen.keyboard.keys.ControlLeft && screen.keyboard.keys.ShiftLeft){
			if(event.code == 'F1' && !screen.is_terminal){
				screen.is_terminal = screen.state;
				screen.state = 'shell';
			}else if(event.code != 'F1' && screen.states[screen.is_terminal]){
				screen.state = screen.is_terminal;
				screen.is_terminal = false;
			}
		}
	});

	console.log = new Proxy(console.log, {
		apply(target, that, args){
			shell.text += args.join(' ') + '\n';
			return Reflect.apply(target, that, args);
		},
	});
}).catch(console.error);