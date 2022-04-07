'use strict';
var fs = require('fs'),
	path = require('path'),
	terser = require('terser'),
	lzutf8 = require('./basefs/lib/lzutf8'),
	Parser = require('./basefs/lib/parser');

process.on('uncaughtException', err => console.log(err));

class Builder {
	constructor(config, fs, output){
		this.fs = fs;
		this.output = output;
		this.config = config;
		this.building = false;
		this.parser = new Parser();
	}
	compact_stats(s){
		return {
			a: s.atimeMs, // accessed
			m: s.mtimeMs, // modified
			c: s.ctimeMs, // created
			b: s.birthtimeMs,
			bl: s.blksize,
			bo: s.blocks,
			n: s.nlink,
			mo: s.mode,
			i: s.ino,
			d: s.dev,
		};
	}
	// BETA:::::::::::
	async pack_fs(dir, files = [], prefix = ''){
		for(var file of await fs.promises.readdir(dir)){
			var full = path.join(dir, file),
				stats = await fs.promises.stat(full),
				ind = path.posix.join('/', prefix, file),
				type = stats.isDirectory() ? 'folder' : 'file';
			
			files.push({ name: ind, type: type, data: type == 'folder' ? undefined: await fs.promises.readFile(full)  });
			
			if(type == 'folder')await this.pack_fs(full, files, ind);
		}
		
		files.push({ name: path.posix.join('/', prefix), data: '', type: 'folder' });
		
		return files;
	}
	compress(data){
		return new Promise((resolve, reject) => lzutf8.compressAsync(data, { outputEncoding: 'Base64' }, (data, err) => err ? reject(err) : resolve(data)))
	}
	async pack_fs_1(dir, files = {}, prefix = ''){ // browse each directory => lzutf8 on files
		for(var file of await fs.promises.readdir(dir)){
			var full = path.join(dir, file),
				stats = await fs.promises.stat(full),
				ind = path.posix.join('/', prefix, file);
			
			files[ind] = [ this.compact_stats(stats) ];
			
			if(!stats.isDirectory())files[ind][1] = await this.compress(await fs.promises.readFile(full, 'base64'));
			
			if(stats.isDirectory())await this.pack_fs_1(full, files, ind);
		}
		
		files[path.posix.join('/', prefix)] = [ this.compact_stats(await fs.promises.stat(dir)) ];
		
		return files;
	}
	watch(callback){
		var run = this.build();
		
		if(callback)callback.call(this, run);
		
		return fs.watch(this.fs, { recursive: true }, (type, filename) => {
			if(!filename || this.building)return;
			
			var run = this.build();
			
			if(callback)callback.call(this, run);
		});
	}
	async build(){
		if(this.building)return;
		
		this.building = true;
		
		if(this.config.log)console.log('Building...');
		
		var terser_opts = {
				compress: this.config.fast ? false : true,
				mangle: true,
				format: {
					comments: false,
					quote_style: 1,
				},
			},
			bundle_ind = 0,
			bundle_data = data => {
				var plain = (path.extname(data.path) == '.json' ? 'module.exports=' : '') + fs.readFileSync(data.path, 'utf8'),
					out = [],
					name = data.options.expose || data.path;
				
				return out.concat(JSON.stringify([ name ]).slice(1, -1) + '(module,exports,require,global,process){' + plain + '}').join(',');
			};
		
		var bundle = `require=((l,p)=>(f,c,m,e)=>{c=l[f.toLowerCase()];if(!c)throw new Error("Cannot find module '"+f+"'");e={};m={get exports(){return e},set exports(v){return e=v}};c(m,e,require,globalThis,p);return e})({${this.config.bundle.map(data => bundle_data({ path: path.resolve(__dirname, ...data.path), options: data.options }))}},{argv:[],argv:[],last_pid:0,cwd:_=>'/',kill:_=>close(_),nextTick:_=>requestAnimationFrame(_)});`;
		
		if(this.config.minify.enabled){
			var terser_start = Date.now();
			
			bundle = (await terser.minify(bundle.toString(), terser_opts)).code;
			
			if(this.config.log)console.log('Took ' + (Date.now() - terser_start) + 'ms for terser');
		}
		
		// fs.promises.writeFile(this.output + '.bin', this.parser.write(await this.pack_fs(this.fs)));
		
		var fs_string = JSON.stringify(await this.pack_fs_1(this.fs));
		
		await fs.promises.writeFile(this.output + '.html', `<!DOCTYPE HTML><html><head><meta charset='utf8'><title>vibeOS NEW</title></head><body><script>\n\ndocument.body.innerHTML='';var a=${fs_string},${bundle}require('webos');\n//# sourceURL=webOS_loader</script></body></html>`);
		
		this.building = false;
		
		if(this.config.log)console.log('Build complete.');
	}
}

module.exports = Builder;