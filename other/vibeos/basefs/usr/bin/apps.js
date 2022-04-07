var fs = require('fs'),
	path = require('path'),
	ui = require('/lib/ui'),
	screen = require('/lib/screen');

/*
{ args: Object.assign({}, filter_globals, {
					flags: {},
					request_native: label => {
						if(!this.permissions.includes(label))throw new TypeError('permission for ' + JSON.stringify([ label ]).slice(1, -1) + ' not granted!');
						
						return natives[label];
					},
				}) }
	natives = { // accessible from scripts
		DOM: document,
		WINDOW: window,
	},
	perms = { // script permissions defined above
		'/lib/dom-utils.js': ['DOM'],
		'/lib/screen.js': ['DOM', 'WINDOW'],
		'/etc/init.d/shell.js': ['DOM'],
		'/var/lib/rasterize-html.js': ['NO-SANDBOX'],
		'/var/apps/web.js': ['DOM'],
	},
	safe_global = [
		"WebGLVertexArrayObject","WebGLUniformLocation","WebGLTransformFeedback","WebGLTexture","WebGLSync","WebGLShaderPrecisionFormat","WebGLShader","WebGLSampler","WebGLRenderingContext","WebGLRenderbuffer","WebGLQuery","WebGLProgram","WebGLFramebuffer","WebGLContextEvent","WebGLBuffer","WebGLActiveInfo","WebGL2RenderingContext","Object","Function","Array","Number","parseFloat","parseInt","Infinity","NaN","undefined","Boolean","String","Symbol","Date","Promise","RegExp","Error","EvalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError","globalThis","JSON","Math","console","Intl","ArrayBuffer","Uint8Array","Int8Array","Uint16Array","Int16Array","Uint32Array","Int32Array","Float32Array","Float64Array","Uint8ClampedArray","BigUint64Array","BigInt64Array","DataView","Map","BigInt","Set","WeakMap","WeakSet","Proxy","Reflect","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape","eval","isFinite","isNaN","global","process","Buffer","URL","URLSearchParams","TextEncoder","TextDecoder","AbortController","AbortSignal","EventTarget","Event","MessageChannel","MessagePort","MessageEvent","clearInterval","clearTimeout","setInterval","setTimeout","queueMicrotask","clearImmediate","setImmediate","SharedArrayBuffer","Atomics","AggregateError","FinalizationRegistry","WeakRef","WebAssembly",'FontFace','Image','Path2D','DOMParser','XMLSerializer',
	],
	filter_globals = Object.fromEntries(Object.getOwnPropertyNames(global).filter(key => !safe_global.includes(key)).map(key => [ key, undefined ]));
*/

module.exports = class {
	constructor(){
		this.dir = '/var/apps';
		
		this.app = class {
			constructor(manifest, location){
				this.name = manifest.name || 'Application';
				this.category = manifest.category || '';
				this.description = manifest.description || '';
				this.icon = path.resolve(location, manifest.icon);
				this.script = path.resolve(location, manifest.main || 'index.js');
				this.version = manifest.version || '0.0.1';
				this.places = manifest.places;
				// storing stuff
				this.data = manifest.data || {};
				
				// somehow transfer permissions to require or pass manifest pass and do processing there
				// safer
				
				this.permissions = [];
				
				if(!Array.isArray(this.places))this.places = [];
				
				this.module = require(this.script);
				
				if(this.places.includes('desktop'))user.desktop.open.push({
					icon: this.icon,
					title: this.name,
					func: () => this.open('desktop'),
					args: {
						flags: {
							folder: '/lost+found/',
						},
					},
					context_menu: null,
				});
				
				// try folder.subfolder.subfolder soon for naming
				// folder.id instead of title?
				// more effective
				
				var menu_spot = user.bar.menu.open.find(folder => (folder.title || '').toUpperCase() == this.category.toUpperCase());
				
				if(this.places.includes('menu') && menu_spot)menu_spot.contents.push({
					icon: this.icon,
					title: this.name,
					func: () => this.open('menu'),
				});
			}
			open(place){
				if(this.window && !this.window.deleted)return this.window.bring_front();
				
				this.window = screen.layers.append(new ui.window(Object.assign({
					icon: this.icon,
					title: this.name,
					show_in_bar: place == 'desktop',
				}, this.module.opts)));
				
				this.window.bring_front();
				
				this.module.open(this.window, this.data);
			}
		}
		
		fs.readdirSync(this.dir).splice(2).map(fn => path.join(this.dir, fn)).forEach(folder => {
			var manifest_path = path.join(folder, 'manifest.json');
			
			if(!fs.existsSync(manifest_path))return console.error('manifest missing for ' + folder);
			
			new this.app(this.manifest(manifest_path), folder);
		});
	}
	manifest(path){
		try{ return JSON.parse(fs.readFileSync(path)); }catch(err){ throw new Error('error parsing manifest JSON (' + path + '):\n', err); }; 
	}
	/*open(folder){
		var manifest_path = path.join(folder, 'manifest.json'),
			manifest;
		
		if(!fs.existsSync(manifest_path))return console.error('manifest missing for ' + folder);
		
		try{ manifest = JSON.parse(fs.readFileSync(manifest_path)); }catch(err){ console.error('error parsing manifest JSON (' + manifest_path + '):\n', err); };
		
		return new this.app(manifest, folder);
	}*/
	/*read_reg(){
		return this.reg = fs.existsSync(this.file) ? JSON.parse(fs.readFileSync(this.file, 'utf8')) : [];
	}
	write_reg(){
		return fs.writeFileSync(this.file, JSON.stringify(this.reg));
	}
	reload_reg(){
		this.read_reg();
		
		console.log('load apps??');
	}*/
}