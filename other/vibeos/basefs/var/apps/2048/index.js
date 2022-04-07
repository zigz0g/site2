'use strict';
var ui = require('/lib/ui.js'),
	tween = require('/var/lib/tween.js');

exports.opts = {
	x: ui.align.middle, 
	y: ui.align.middle,
	width: 300,
	height: 400,
	menu: {
		File: {
			Exit(window){
				window.close();
			},
		},
		Game: {
			Reset(window){
				window.game.start();
			},
		},
	},
};

exports.open = window => {
	var game = window.game = {
			color: {
				// BG | TEXT
				2: ["#eee4da", "#776e65"],
				4: ["#ede0c8", "#776e65"],
				8: ["#f2b179", "#f9f6f2"],
				16: ["#f59563", "#f9f6f2"],
				32: ["#f67c5f", "#f9f6f2"],
				64: ["#f65e3b", "#f9f6f2"],
				128: ["#edcf72", "#f9f6f2"],
				256: ["#edcc61", "#f9f6f2"],
				512: ["#edc850", "#f9f6f2"],
				1024: ["#edc53f", "#f9f6f2"],
				2048: ["#edc22e", "#f9f6f2"],
			},
			con: window.content.append(new ui.rect({
				color: '#BAA',
				radius: 6,
				width: '80%',
				get height(){
					return this.fixed.width;
				},
				x: ui.align.middle,
				y: ui.align.bottom,
				offset: {
					get y(){
						return (window.content.fixed.width - game.con.fixed.width) * -0.5;
					},
				},
			})),
			dirs: {
				ArrowUp: 'up',
				ArrowDown: 'down',
				ArrowLeft: 'left',
				ArrowRight: 'right',
			},
			score: 0,
			best: 0,
			start(){
				game.cells.forEach(cell => {
					cell.deleted = true;
				});
				
				game.cells = [];
				
				game.score = 0;
				game.add_cell();
			},
			grid: 4,
			cells: [],
			get_cell(x, y){
				return this.cells.find(cell => cell.grid_x == x && cell.grid_y == y);
			},
			cell: class extends ui.element {
				constructor(x, y){
					super({
						margin: 5,
						radius: 5,
						get x(){
							return ((this.width + this.margin) * (thise.mtween ? this.tween_x : this.grid_x)) + (this.margin * 2);
						},
						get y(){
							return ((this.height + this.margin) * (this.mtween ? this.tween_y : this.grid_y)) + (this.margin * 2);
						},
						get width(){
							return (game.con.fixed.width / game.grid) - (this.margin * 2);
						},
						get height(){
							return (game.con.fixed.height / game.grid) - (this.margin * 2);
						},
						grid_x: x,
						grid_y: y,
						count: 2,
					}, {});
					
					var thise = this;
					
					this.bg = this.append(new ui.rect({
						x: ui.align.middle,
						y: ui.align.middle,
						get width(){
							return (thise.stween ? this.tween_width : 100) + '%';
						},
						get height(){
							return  (thise.stween ? this.tween_height : 100) + '%';
						},
						get alpha(){
							return thise.stween ? this.tween_height / 100 : 1;
						},
						get color(){
							return game.color[thise.count][0];
						},
					}));
					
					this.text = this.bg.append(new ui.text({
						x: ui.align.middle,
						y: ui.align.middle,
						get text(){
							return thise.count;
						},
						get color(){
							return game.color[thise.count][1];
						},
						weight: 'bold',
					}));
				}
				draw(ctx, dims){
					if(this.mtween)this.mtween.update();
					if(this.stween)this.stween.update();
				}
			},
			add_cell(){
				var shuffled = [];
				
				for (var i = game.cells.length - 1; i > 0; i--) {
					var j = Math.floor(Math.random() * (i + 1));
					var temp = game.cells[i];
					
					shuffled[i] = game.cells[j];
					shuffled[j] = temp;
				}
				
				var grid_spaces = game.grid_spaces();
				
				var space = grid_spaces[~~(Math.random() * grid_spaces.length)],
					cell = game.con.append(new game.cell(space[0], space[1]));
				
				game.cells.push(cell);
				
				cell.stween = new tween.Tween({ x: 10, y: 10 }).to({ x: 100, y: 100 }, 100).easing(tween.Easing.Quadratic.Out).onUpdate(obj => {
					cell.bg.tween_width = obj.x;
					cell.bg.tween_height = obj.y;
				}).onComplete(() => cell.stween = null).start();
				
				return cell;
			},
			max_cells(){
				return Array.from(Array(this.grid * this.grid)).map((val, ind) => [ ind % 4, ~~(ind / 4) ]);
			},
			grid_spaces(){
				var max_cells = this.max_cells();
				
				return max_cells.filter(([ x, y ]) => !this.get_cell(x, y));
			},
			key(dir){
				var change = {
					x: dir == 'left' ? -1 : dir == 'right' ? 1 : 0,
					y: dir == 'up' ? -1 : dir == 'down' ? 1 : 0,
				};
				
				Array.from(Array(game.grid)).forEach((x, ind) => game.cells.forEach(cell => {
					var changed = true,
						prev_x,
						prev_y,
						inc_x,
						inc_y,
						intersect;
					
					while(!intersect && changed){
						inc_x = Math.min(Math.max(cell.grid_x + change.x, 0), game.grid - 1);
						inc_y = Math.min(Math.max(cell.grid_y + change.y, 0), game.grid - 1);
						intersect = game.cells.find(fe => fe.grid_x == inc_x && fe.grid_y == inc_y && fe.count);
						
						changed = inc_x != prev_x || inc_y != prev_y;
						
						if(intersect && intersect != cell && intersect.count == cell.count)inc_x = prev_x, inc_y = prev_y;
						
						prev_x = inc_x;
						prev_y = inc_y;
					}
					
					if(intersect && intersect != cell && intersect.count == cell.count){
						cell.intersect = intersect;
						game.score += cell.count *= 2;
						
						if(game.score > game.best)game.best = game.score;
						
						var in_arr = game.cells.findIndex(c => c == cell.intersect);
						
						if(in_arr != -1)game.cells.splice(in_arr, 1);
						
						cell.intersect.deleted = true;
						
						cell.to_x = inc_x;
						cell.to_y = inc_y;
					}
					
					if(!intersect){
						cell.to_x = inc_x;
						cell.to_y = inc_y;
					}
				}));
				
				game.cells.forEach(cell => {
					if(cell.stween)cell.stween.stop(), cell.bg.tween_width = cell.bg.tween_height = cell.stween = null;
					if(cell.mtween)cell.mtween.stop(), cell.mtween = null;
					
					cell.intersect = null;
					
					if(cell.to_x == null || cell.to_y == null || cell.mtween)return;
					
					cell.mtween = new tween.Tween({ x: cell.grid_x, y: cell.grid_y }).to({ x: cell.to_x, y: cell.to_y }, 100).easing(tween.Easing.Quadratic.Out).onUpdate(obj => {
						cell.tween_x = obj.x;
						cell.tween_y = obj.y;
					}).onComplete(() => cell.mtween = null).start();
					
					cell.grid_x = cell.to_x;
					cell.grid_y = cell.to_y;
					
					delete cell.to_x;
					delete cell.to_y;
				});
				
				game.add_cell();
			},
			counter: class extends ui.rect {
				constructor(label, gen_text, ofs){
					super({
						color: '#BAA',
						radius: 6,
						width: 80,
						height: 50,
						x: ui.align.right,
						y: 10,
					});
					
					Object.defineProperty(this.offset, 'x', { get: _ => (window.content.fixed.width - game.con.fixed.width) * -(0.5 + ofs) });
					
					this.value = 0;
					
					this.label = this.append(new ui.text({
						color: '#EEE4DA',
						text: label,
						x: ui.align.middle,
						y: 15,
						wrap: false,
					}));
					
					this.counter = this.append(new ui.text({
						color: '#F0F8FF',
						get text(){
							return gen_text();
						},
						x: ui.align.middle,
						y: 35,
						size: 24,
						weight: 'bold',
						wrap: false,
					}));
					
					window.content.append(this);
				}
			},
		},
		score = new game.counter('SCORE', () => game.score, 0),
		best = new game.counter('BEST', () => game.best, 1.5);

	window.content.on('keydown', event => {
		if(game.dirs[event.code])game.key(game.dirs[event.code]);
	});

	game.add_cell();
	
	window.content.color = '#FFE';
};