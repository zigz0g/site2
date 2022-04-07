'use strict';
var ui = require('/lib/ui.js'),
	fs = require('fs'),
	path = require('path'),
	mime = require('mime'),
	image_aliases = {
		'/lost+found': '/usr/share/places/emptytrash.png',
		[require.user.home]: '/usr/share/places/folder-home.png',
		[path.join(require.user.home, 'Desktop')]: '/usr/share/places/folder-desktop.png',
	},
	ext_icons = {
		'application/': '/usr/share/mimes/shell.png',
		'image/': '/usr/share/mimes/media.png',
	},
	ext_ent = Object.entries(ext_icons);

exports.opts = {
	x: ui.align.middle, 
	y: ui.align.middle,
	offset: { x: 75, y: 0, },
	width: 600,
	height: 300,
	menu: {
		File: {
			Exit(window){
				window.close();
			},
		},
	},
}

exports.open = (window, data) => {
	var exp = {
			txt_editor: '/var/apps/text-editor',
			img_viewer: '/var/apps/image-viewer',
			sidebar: window.content.append(new ui.scroll_box({
				width: '30%',
				height: '100%',
				clip: true,
				inner_height: 400,
			})),
			contents: window.content.append(new ui.scroll_box({
				x: '30%',
				width: '70%',
				height: '100%',
				inner_height: 600,
			})),
			folders: {},
			add_entry(loc, element, prev){ // add context menu soon!
				var stats = fs.statSync(loc),
					container = element.append(new ui.rect({
						width: '100%',
						height: 22,
						get color(){
							return this.focus ? '#CCE8FF' : this.hover ? '#E5F3FF' : 'transparent';
						},
						get y(){
							return prev.container.y + (prev.container.fixed || { container: { height: 0 } }).height;
						},
					})),
					data = {
						container: container,
						border: container.append(new ui.border({
							type: 'inset',
						})),
						icon: container.append(new ui.image({
							width: 16,
							height: 16,
							x: 4,
							y: ui.align.middle,
							interact: false,
							path: stats.isDirectory() ? '/usr/share/places/folder.png' : '/usr/share/mimes/exec.png',
						})),
						text: container.append(new ui.text({
							x: 24,
							y: ui.align.middle,
							color: '#000',
							text: path.basename(loc),
							interact: false,
						})),
						mime: mime.getType(loc) || '',
					};
				
				container.on('doubleclick', () => {
					stats.isDirectory()
						? create_folders(loc)
						: data.mime.startsWith('image')
							? new user.apps.app(Object.assign(user.apps.manifest(path.join(exp.img_viewer, '/manifest.json')), {
								data: { file: loc },
								places: [],
							}), exp.img_viewer).open()
							: new user.apps.app(Object.assign(user.apps.manifest(path.join(exp.txt_editor, '/manifest.json')), {
								data: { file: loc },
								places: [],
							}), exp.txt_editor).open();
				});
				
				return data;
			},
		},
		create_contents = dir => {
			exp.contents.content.elements.forEach(ele => ele.deleted = true);
			
			var prev = { container: { y: 0, fixed: { height: 0 } } };
			
			fs.readdirSync(dir).slice(2).sort(file => fs.statSync(path.join(dir, file)).isDirectory() ? -10 : 10).map(file => ({
				name: file,
				path: path.join(dir, file),
			})).forEach(file => {
				var val = exp.add_entry(file.path, exp.contents.content, prev);
				
				val.border.assign_object({
					get color(){
						return val.container.focus ? '#99D1FF' : 'transparent';
					},
				});
				
				file.is_dir = fs.statSync(file.path).isDirectory();
				file.ext = path.extname(file.path);
				file.mime = mime.getType(file.path) || '';
				
				val.icon.path = image_aliases[file.path] ||
					(file.is_dir ? '/usr/share/places/folder.png' : 0) ||
					(ext_ent.find(([ key ]) => file.mime.startsWith(key))||[])[1] ||
					'/usr/share/mimes/exec.png';
				
				val.text.text = file.name;
				
				prev = val;
			});
		},
		create_folders = (dir, element) => {
			exp.sidebar.set_scroll(0);
			exp.contents.set_scroll(0);
			exp.sidebar.content.elements.forEach(ele => ele.deleted = true);
			
			create_contents(dir);
			
			window.title = dir;
			window.set_icon(image_aliases[dir] || '/usr/share/places/folder.png');
			
			var prev = { container: { y: 0, fixed: { height: 0 } } };
			
			[{
				name: 'Home',
				path: require.user.home,
			},{
				name: 'Desktop',
				path: path.join(require.user.home, 'Desktop'),
			}].concat(fs.readdirSync(dir).filter(file => fs.statSync(path.join(dir, file)).isDirectory()).slice(1).map(file => ({
				name: file,
				path: path.join(dir, file),
			}))).forEach(file => {
				var val = exp.add_entry(file.path, exp.sidebar.content, prev);
				
				val.container.assign_object({
					get color(){
						return this.focus ? '#CDE8FF' : this.hover ? '#E5F3FF' : 'transparent';
					}
				});
				
				val.icon.path = image_aliases[file.path] || '/usr/share/places/folder.png';
				
				val.text.text = file.name;
				
				prev = val;
			});
		};

	create_folders(data.folder || '/');

	exp.sidebar.border = exp.sidebar.append(new ui.border({
		color: '#000',
		size: 1,
	}));
}