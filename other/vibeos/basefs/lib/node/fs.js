'use strict';
var path = require('path'),
	mime = require('mime'),
	events = require('events'),
	lzutf8 = require('lzutf8'),
	Buffer = require('buffer').Buffer,
	is_object = item => item && typeof item == 'object' && !Array.isArray(item),
	merge_deep = (target, ...sources) => {
		if(!sources.length)return target;
		var source = sources.shift();

		if(is_object(target) && is_object(source))for(const key in source)if(is_object(source[key]))!target[key] && Object.assign(target, { [key]: {} }), merge_deep(target[key], source[key]);
		else Object.assign(target, { [key]: source[key] });

		return merge_deep(target, ...sources);
	},
	filesys = class {
		constructor(name){
			this.dynamic = {};
			this.static = {};
			this.name = 'fs' + name;
			
			Object.keys(localStorage).forEach(key => {
				if(!key.startsWith(this.name))return localStorage.removeItem(key);
				
				var ke = key.substr(this.name.length),
					def = obj => Object.defineProperty(obj, ke, {
						get: _ => JSON.parse(localStorage.getItem(key)),
						set: v => (delete obj[ke], obj[ke] = v),
						configurable: true,
						enumerable: true,
					});
				
				def(this.dynamic);
				def(this.static);
			});
			
			this.url_cache = {};
		}
		emit(event, file){
			// TODO:
			// emit to fs watcher stuff
		}
		stat_change(prev, curr){
			// emit to fs.watchFile
		}
		update(){
			Object.entries(this.dynamic).forEach(([ key, val ]) => localStorage.setItem(this.name + key, JSON.stringify(val)));
		}
		mount(mount_point, type, data){
			var parsed = data;
			
			switch(type){
				case'json':
					parsed = JSON.parse(data);
					break
			}
			
			console.log('[FS] Mounting ' + type + ' volume at ' + mount_point);
			
			merge_deep(this.static, this.dynamic, this.dynamic, parsed);
			
			filesystem.update();
			
			return module.exports;
		}
		overview(file){
			var res = path.resolve(file);
			
			if(!this.static[res])throw errors.enoent(res);
			
			return this.static[res];
		}
		stat(file){
			var [ stat, data ] = this.overview(path.resolve(file));
			
			return {
				isDirectory: () => !data,
				atimeMs: stat.a,
				mtimeMs: stat.m,
				ctimeMs: stat.c,
				birthtimeMs: stat.b,
				blksize: stat.bl,
				blocks: stat.bo,
				nlink: stat.n,
				mode: stat.mo,
				ino: stat.i,
				dev: stat.dev,
			};
		}
		exists(file){
			var res = path.resolve(file);
			
			return !!this.static[res];
		}
		watch(dir, ...args){
			var options = args.find(arg => typeof arg == 'object') || {},
				callback = args.find(arg => typeof arg == 'function') || {};
			
			if(!fs.statSync(dir).isDirectory())throw errors.enotdir(dir);
			
			// finish soon
		}
		watchFile(file, ...args){
			
		}
		read(file, encoding){
			var overview = this.overview(file);
			
			if(this.stat(file).isDirectory())throw errors.eisdir('read', file);
			
			// console.log('[FS] READ ' + file + ', ' + encoding);
			
			var data = Buffer.from(lzutf8.decompress(overview[1], { inputEncoding: 'Base64' }), 'base64');
			
			return encoding ? data.toString(encoding) : data
		}
		read_dir(file){
			var res = path.resolve(file);
			
			return ['.', '..'].concat(Object.keys(this.static).filter((key, h) => (h = path.dirname(key)) && key != res && h == res).map(de => path.relative(file, de)));
		}
		write(file, data, options){
			if(typeof data != 'string' && !(data instanceof Buffer) && !Array.isArray(data))throw errors.invalid_arg_type('data', ['Buffer', 'TypedArray', 'DataView'], typeof data);
			
			if(this.exists(file) && this.stat(file).isDirectory())return errors.eisdir('open', file);
			
			var res = path.resolve(file),
				compressed = lzutf8.compress(Buffer.from(data).toString('base64'), { outputEncoding: 'Base64' }),
				prevs = this.exists(file) ? this.stat(file) : { c: Date.now(), m: Date.now(), a: Date.now() };
			
			this.static[res] = this.dynamic[res] = [ Object.assign(prevs, {
				m: Date.now(),
				a: Date.now(),
			}), compressed ];
			
			this.update();
		}
		mkdir(dir){
			if(this.exists(dir))return errors.eexists('mkdir', dir);
			
			var res = path.resolve(dir),
				prevs = this.exists(dir) ? this.stat(dir) : { c: Date.now(), m: Date.now(), a: Date.now() };
			
			this.static[res] = this.dynamic[res] = [ Object.assign(prevs, {
				m: Date.now(),
				a: Date.now(),
			}), 0 ];
			
			this.update();
		}
		unlink(file){
			var resolved = path.resolve(file),
				resolved_split = resolved.split('/').filter(file => file),
				dirname = path.dirname(file),
				basename = path.basename(file),
				depth = this.walk_file(dirname),
				depth_dyn = this.walk_file_dynamic(dirname),
				ret = Reflect.deleteProperty(depth, basename) && Reflect.deleteProperty(depth_dyn, basename);
			
			this.update();
			
			return ret;
		}
		data_uri(file){
			// USE BLOB AND URL OBJECT INSTEAD
			// CACHE IT TOO
			
			if(this.url_cache[file])return this.url_cache[file];
			
			return (this.url_cache[file] = URL.createObjectURL(new Blob([ this.read(file) ], { type: mime.getType(file) })));
		}
		download(file){
			var object_url = URL.createObjectURL(new Blob([ this.read(file) ])),
				link = Object.assign(document.body.appendChild(document.createElement('a')), {
					download: path.basename(file),
					href: object_url,
				});
			
			link.click();
			URL.revokeObjectURL(object_url);
		}
	},
	filesystem = new filesys('3'),
	errors = {
		eexists(operation, dir){
			return new TypeError('EEXIST: file already exists, ' + operation + ' \'' + dir + '\'')
		},
		enoent(file){
			return new TypeError('ENOENT: no such file or directory, open \'' + file + '\'');
		},
		enotdir(dir){
			return new TypeError('ENOTDIR: not a directory, scandir \'' + dir + '\'');
		},
		eisdir(operation, file){
			return new TypeError('EISDIR: illegal operation on a directory, ' + operation + ' \'' + file + '\'');
		},
		invalid_arg_type(label, types, recieved){
			return new TypeError('INVALID_ARG_TYPE: The "' + label + '" argument must be of type ' + types.join(', ') + '. Received ' + recieved)
		},
	};

module.exports = window.fs = {
	fs: filesystem,
	readFile(file, ...args){
		var options = args.find(arg => typeof arg == 'object') || {},
			callback = args.find(arg => typeof arg == 'function') || {},
			ret; try{ ret = filesystem.read(file, options.encoding) }catch(err){ ret = err };
		
		callback(ret, ret instanceof Error ? null : ret);
	},
	readFileSync: filesystem.read.bind(filesystem),
	writeFileSync: filesystem.write.bind(filesystem),
	writeFile(file, data, ...args){
		var options = args.find(arg => typeof arg == 'object') || {},
			callback = args.find(arg => typeof arg == 'function') || {},
			ret; try{ ret = filesystem.write(file, data, options) }catch(err){ ret = err };
		
		callback(ret, ret instanceof Error ? null : ret);
	},
	readdirSync: filesystem.read_dir.bind(filesystem),
	readdir(dir, callback){
		var ret; try{ ret = filesystem.read_dir(file) }catch(err){ ret = err };
		
		callback(ret, ret instanceof Error ? null : ret);
	},
	existsSync: filesystem.exists.bind(filesystem),
	exists: (file, callback) => callback(null, filesystem.exists(file)),
	statSync: filesystem.stat.bind(filesystem),
	stat(file, callback){
		var ret; try{ ret = filesystem.stat(file) }catch(err){ ret = err };
		
		callback(ret, ret instanceof Error ? null : ret);
	},
	unlinkSync: filesystem.unlink.bind(filesystem),
	unlink(file, callback){
		var ret; try{ ret = filesystem.unlink(file) }catch(err){ ret = err };
		
		callback(ret, ret instanceof Error ? null : ret);
	},
	mkdirSync: filesystem.mkdir.bind(filesystem),
	mkdir(dir, callback){
		var ret; try{ ret = filesystem.mkdir(dir) }catch(err){ ret = err };
		
		callback(ret, ret instanceof Error ? null : ret);
	},
	mount: filesystem.mount.bind(filesystem),
	download: filesystem.download.bind(filesystem),
	data_uri: filesystem.data_uri.bind(filesystem),
};