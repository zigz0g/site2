var ui = require('/lib/ui.js'),
	mime = require('mime'),
	path = require('path'),
	img_viewer = class {
		constructor(window){
			var thise = this,
				bu_opts = {
					width: 50,
					height: 50,
					auto_width: false,
					x: ui.align.middle,
					y: ui.align.bottom,
				};
			
			this.max_width = 350;
			this.max_height = 350;
			
			this.image = '';
			
			this.folder = {
				ind: 0,
				images: [''],
			};
			
			this.main = window.content.append(new ui.image({
				x: ui.align.middle,
				y: 30,
				width: this.max_width,
				height: this.max_height,
			}));
			
			this.label = window.content.append(new ui.text({
				x: ui.align.middle,
				y: 4,
				get text(){
					return (thise.folder.ind + 1) + ' / ' + thise.folder.images.length + ' - ' + thise.image;
				},
				color: '#000',
				cursor: 'text',
			}));
			
			this.back_bu = window.content.append(new ui.button(Object.assign({
				offset: {
					x: -25,
					y: -20,
				},
			}, bu_opts, {
				text: '←',
			})));
			
			this.next_bu = window.content.append(new ui.button(Object.assign({
				offset: {
					x: 25,
					y: -20,
				},
			}, bu_opts, {
				text: '→',
			})));
			
			this.main.border = this.main.append(new ui.border({
				color: '#000',
				size: 2,
			}));
			
			this.back_bu.on('click', () => this.back());
			
			this.next_bu.on('click', () => this.next());
			
			this.main.on('load', () => {
				var scale = Math.min(this.max_width / this.main.image.width, this.max_height / this.main.image.height);
				
				this.main.width = this.main.image.width * scale;
				this.main.height = this.main.image.height * scale;
			});
		}
		load(loca){
			if(!fs.existsSync(loca))return console.error('error at image viewer, ' + loca + ' doesnt exist!');
			
			this.folder = {
				path: path.dirname(loca),
			};
			
			this.folder.images = fs.readdirSync(this.folder.path).filter(file => (mime.getType(file) || '').startsWith('image')),
			this.folder.ind = this.folder.images.findIndex(file => file == path.basename(loca));
			this.main.path = this.image = loca;
		}
		back(){
			var found = this.folder.images[this.folder.ind - 1];
			
			this.load(found ? path.join(this.folder.path, found) : this.main.path);
		}
		next(){
			var found = this.folder.images[this.folder.ind + 1];
			
			this.load(found ? path.join(this.folder.path, found) : this.main.path);
		}
	};

exports.opts = {
	x: ui.align.middle, 
	y: ui.align.middle,
	width: '400px',
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
	var viewer = new img_viewer(window);
	
	viewer.load(data.file || '/usr/share/categ/games.png');
};