'use strict';

var fs = require('fs');

class Parser {
	constructor(){
		this.true = '\u0001';
		this.false = '\u0000';
		this.end_of_text = '\u0003';
	}
	read_block(bin, index){
		var type = bin[index] == this.true.charCodeAt() ? 'folder' : 'file';
		
		if(isNaN(index))throw new RangeError(index);
		
		var end_name_length = bin.indexOf(this.end_of_text, index + 1);
		
		if(end_name_length == -1)return null;
		
		var name_length = parseInt(bin.slice(index + 1, end_name_length), 16),
			end_name = end_name_length + 1 + name_length,
			name = bin.slice(end_name_length + 1, end_name);
		
		// console.log(end_name_length, name_length, bin.slice(index + 1, end_name_length) + '');
		
		if(type == 'folder')return {
			name: name.toString(),
			type: 'folder',
			size: end_name,
		};
		
		var end_data_length = bin.indexOf(this.end_of_text, end_name),
			data_length = parseInt(bin.slice(end_name, end_data_length), 16),
			data_end = end_data_length + 1 + data_length,
			data = bin.slice(end_data_length + 1, end_data_length + 1 + data_length);
		
		return {
			name: name.toString(),
			data: data,
			type: type,
			size: (end_data_length + 1 + data_length) - index,
		};
	}
	tick(){
		return new Promise(resolve => setImmediate(() => resolve()));
	}
	async read(bin){
		var last_block = 0,
			blocks = [],
			block;
		
		while((await this.tick(), block = this.read_block(bin, last_block))){
			console.log(block);
			blocks.push(block);
			
			last_block += block.size;
		}
		
		return blocks;
	}
	
	write(files){
		var fs = require('fs'),
			string = '';
		
		for(var file of files){
			string += file.type == 'folder' ? this.true : this.false;
			
			string += Buffer.byteLength(file.name).toString(16) + this.end_of_text;
			string += file.name;
			
			if(file.type == 'folder')continue;
			
			string += Buffer.byteLength(file.data).toString(16) + this.end_of_text;
			string += file.data;
		}
		
		return string;
	}
};

/*
var parser = new Parser(),
	bin = './dist.bin',
	data = parser.write([
		{ name: '/baklls', type: 'folder' },
		{ name: '/baklls/test', type: 'file', data: 'ae' },
		{ name: '/test file.txt', type: 'file', data: 'this is a smple of d' },
		{ name: '/test fil2.txt', type: 'file', data: 'this is a smple of d' },
		{ name: '/texx2.txt', type: 'file', data: 'tk' },
	]);

console.log(data);

parser.read(data).then(files => console.log('GOT:', files));

*/

module.exports = Parser;