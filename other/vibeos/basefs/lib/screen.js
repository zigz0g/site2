'use strict';
var screen = web.screen = module.exports = {
		states: {},
		state: 'none',
		append_layers(...elements){
			screen.layers.push(...elements);
			
			elements.forEach(element => element.append_state = screen.state);
			
			return elements[0];
		},
		get layers(){
			if(!screen.states[screen.state])screen.states[screen.state] = [];
			
			return Object.assign(screen.states[screen.state], { append: screen.append_layers });
		},
		dims: {
			x: 0,
			y: 0,
			width: 1000,
			height: 600,
		},
	},
	fs = require('fs'),
	dom_utils = require('./dom-utils.js'),
	ui = require('./ui.js'),
	events = require('events'),
	container = screen.container = dom_utils.add_ele('div', document.body, {
		width: screen.dims.width,
		height: screen.dims.height,
		style: `
			overflow: hidden;
			display: block;
			position: absolute;
			width: ${screen.dims.width}px;
			height: ${screen.dims.height}px;
			margin: auto;
			top: 0px;
			bottom: 0px;
			left: 0px;
			right: 0px;
			outline: none;`,
	}),
	canvas = screen.canvas = dom_utils.add_ele('canvas', screen.container, {
		contentEditable: true,
		className: 'webos',
		width: screen.dims.width,
		height: screen.dims.height,
		style: `
			width: ${screen.dims.width}px;
			height: ${screen.dims.height}px;
			outline: none;`,
	}),
	mouse = web.mouse = Object.assign(new events(), {
		buttons: {},
		previous: {},
		focus: [],
		cursor: 'pointer',
		handler(event){
			mouse.previous.x = mouse.x || 0;
			mouse.previous.y = mouse.y || 0;
			
			mouse.x = event.layerX;
			mouse.y = event.layerY;
			
			mouse.movement = {
				x: mouse.x - mouse.previous.x,
				y: mouse.y - mouse.previous.y,
			};
			
			var which = ([
				'none',
				'left',
				'middle',
				'right',
			])[event.which];
			
			mouse.buttons[which] = true;
			 
			var all_elements = [],
				add_elements = (arr, dims, start_opts = {}) => arr.filter(element => element.visible && element.interact).forEach(element => {
					// only_contents flag exists for interact
					
					start_opts = Object.assign({}, start_opts);
					
					if(dims && dims.translate && dims.translate.enabled)start_opts.translate = dims.translate;
					if(dims.clip)start_opts.clip = dims;
					
					element.dims = dims;
					element.start_opts = start_opts;
					
					element.fixed = ui.fixed_sp(element, dims);
					
					if(element.interact === true)all_elements.push(element);
					
					add_elements(element.elements, element.fixed);
				});
			
			add_elements(screen.layers, screen.dims);
			
			/*
			// fix always_on_top elements not recieving cursor events as if they are on top
			*/
			
			all_elements = mouse.all_elements = all_elements.sort((ele, pele) => pele.layer - (pele.always_on_top ? ele.layer - pele.layer : ele.layer));
			
			var target = all_elements.find(element => screen.element_in_mouse(element, element.dims)) || { emit(){}, cursor: 'pointer', };
			
			target.hover = true;
			
			mouse.cursor = target.cursor;
			
			if(event.type == 'mousedown' && mouse.buttons.left)mouse.target = target;
			
			if(event.type == 'mousedown')target['mouse_' + which] = true;
			
			all_elements.filter(element => element.uuid != target.uuid).forEach(element => {
				element.click_count = 0;
				element.mouse_left = element.mouse_right = element.mouse_middle = element.hover = element.mouse_pressed = false;
			});
			
			if(mouse.buttons.left && mouse.target && mouse.target.uuid == target.uuid && event.type == 'mouseup'){
				target.click_count++;
				
				if(target.click_count >= 2){
					target.emit('doubleclick', event, mouse);
					target.click_count = 0;
				}
				
				target.emit('click', event, mouse);
			}else if(mouse.buttons.right && event.type == 'mouseup')target.emit('contextmenu', event, mouse);
			
			if(event.type == 'mouseup' && mouse.buttons.left != mouse.buttons.right)mouse.target = null;
			
			target.mouse_pressed = mouse.buttons.left && event.type != 'mouseup';
			
			if(mouse.target)mouse.target.mouse_pressed = mouse.buttons.left ? true : false;
			
			if(mouse.target && mouse.target.mouse_pressed)mouse.target.emit('drag', mouse);
			
			if(mouse.target && mouse.target.mouse_pressed && mouse.target.drag){
				mouse.target.drag.offset.x += mouse.movement.x;
				mouse.target.drag.offset.y += mouse.movement.y;
			}
			
			all_elements.filter(ele => ele.includes(target)).forEach(ele => ele.emit('sub-' + event.type, event, mouse));
			
			if(event.type == 'mousedown'){
				var wins = all_elements.filter(element => element instanceof ui.window).sort((ele, pele) => ele.layer - pele.layer),
					target_win = wins.find(element => element.includes(target));
				
				if(target_win && target.steal_focus){
					wins.forEach(element => {
						element.active = false;
						// console.log('modifying: ' + element.layer + ', target: ' + target_win.layer);
						
						// get elements size + sub elements size
						target_win.layer = element.layer + element.nested_size() + 1;
					});
					
					target_win.active = true;
				}else if(target.steal_focus)wins.forEach(element => element.active = false);
				
				mouse.focus = [];
				all_elements.forEach(element => {
					if(element.includes(target)){
						mouse.focus.push(element);
						element.focus = target.steal_focus ? element.toggle_focus ? !element.focus : true : element.focus;
						
						element.should_be_focus = element.toggle_focus ? !element.should_be_focus : true;
					}else element.focus = element.should_be_focus = false;
				});
			}else if(event.type == 'mousedown')target.focus = target.toggle_focus ? !target.focus : true;
			
			if(event.type == 'mouseup'){
				mouse.buttons[which] = false;
				mouse.emit('mouseup', event, mouse);
			}
			
			target.emit(event.type, event, mouse);
		},
	}),
	keyboard = screen.keyboard = Object.assign(new events(), {
		keys: {},
		handler(event){
			// event.preventDefault();
			
			event.func = /F\d+/g.test(event.code);
			
			keyboard.emit(event.type, event);
			
			keyboard.keys[event.code] = event.type == 'keydown' ? true : false;
			
			mouse.focus.forEach(element => element.emit(event.type, event));
		},
		paste(event){
			var data = (event.clipboardData || window.clipboardData).getData('text');
			
			mouse.focus.forEach(ele => ele.emit('paste', { text: data, event: event }));
		},
	});

canvas.addEventListener('mousemove', mouse.handler, { passive: true });
canvas.addEventListener('mousedown', mouse.handler, { passive: true });
canvas.addEventListener('mouseup', mouse.handler, { passive: true });
canvas.addEventListener('wheel', mouse.handler, { passive: true });
canvas.addEventListener('contextmenu', event => (event.preventDefault(), mouse.handler(event)));
canvas.addEventListener('mouseleave', () => mouse.buttons = {}, { passive: true });

window.addEventListener('paste', keyboard.paste, { passive: true });
window.addEventListener('keydown', keyboard.handler);
window.addEventListener('keyup', keyboard.handler);

document.body.style = 'margin: 0px; background: #000;';

var ctx = web.ctx = canvas.getContext('2d'),
	frames = web.fps = 0;

setInterval(() => (web.fps = frames, frames = 0), 1000);

screen.render = () => {
	frames++;
	
	container.style.width = screen.dims.width + 'px';
	container.style.height = screen.dims.height + 'px';
	
	canvas.width = screen.dims.width;
	canvas.height = screen.dims.height;
	
	
	var render_through = (elements, dims, start_opts) => {
		elements.forEach(element => element.visible && element.emit('not_visible'));
		
		elements.sort((ele, pele) => ele.layer - pele.layer).forEach(element => {
			if(!element.visible)return;
			
			if(element.deleted){
				var ind = elements.findIndex(pele => pele.uuid == element.uuid);
				
				if(ind != null)elements.splice(ind, 1);
				
				Object.keys(element).forEach(key => key != 'deleted' && Reflect.deleteProperty(element, key));
				
				return;
			}
			
			ctx.save();
			
			element.fixed = ui.fixed_sp(element, dims);
			
			if(dims.alpha)start_opts.alpha = dims.alpha;
			if(dims.clip)start_opts.clip = dims;
			
			if(start_opts.clip && element.apply_clip){
				var region = new Path2D();
				region.rect(start_opts.clip.x, start_opts.clip.y, start_opts.clip.width, start_opts.clip.height);
				ctx.clip(region, 'evenodd');
			}
			
			if(dims.translate && dims.translate.enabled)start_opts.translate = dims.translate;
			
			ctx.filter = element.filter;
			ctx.globalAlpha = element.alpha || start_opts.alpha;
			
			if(element.radius){
				var region = new Path2D(),
					half_rad = (2 * Math.PI) / 2,
					quat_rad = (2 * Math.PI) / 4,
					radius = typeof element.radius == 'number' ? {
						t: { // top
							l: element.radius,
							r: element.radius,
						},
						b: { // bottom
							l: element.radius,
							r: element.radius,
						},
					} : {
						t: typeof element.radius.t == 'number' ? {
							l: element.radius.t,
							r: element.radius.t,
						} : element.radius.t,
						b: typeof element.radius.b == 'number' ? {
							l: element.radius.b,
							r: element.radius.b,
						} : element.radius.b,
					},
					fixed = element.fixed;
				
				// top left
				region.arc(radius.t.l + fixed.x, radius.t.l + fixed.y, radius.t.l, -quat_rad, half_rad, true);
				region.lineTo(fixed.x, fixed.y + fixed.height - radius.t.l);

				// bottom left
				region.arc(radius.b.l + fixed.x, fixed.height - radius.b.l + fixed.y, radius.b.l, half_rad, quat_rad, true);
				region.lineTo(fixed.x + fixed.width - radius.b.l, fixed.y + fixed.height);

				// bottom right
				region.arc(fixed.x + fixed.width - radius.b.r, fixed.y + fixed.height - radius.b.r, radius.b.r, quat_rad, 0, true);
				region.lineTo(fixed.x + fixed.width, fixed.y + radius.b.r);
				
				// top right
				region.arc(fixed.x + fixed.width - radius.t.r, fixed.y + radius.t.r, radius.t.r, 0, -quat_rad, true);
				region.lineTo(fixed.x + radius.t.r, fixed.y);
				
				ctx.clip(region, 'evenodd');
			}
			
			element.draw(ctx, dims, screen);
			
			ctx.restore();
			
			render_through(element.elements, ui.fixed_sp(element, dims), Object.assign({}, start_opts));
		});
	};
	
	render_through(screen.layers, screen.dims, {});
	
	canvas.style.cursor = 'url("' + fs.data_uri('/usr/share/cursor/' + mouse.cursor + '.cur') + '"), none';
	
	process.nextTick(screen.render);
};

screen.element_in_mouse = element => {
	var dims = element.dims,
		start_opts = element.start_opts,
		fixed = ui.fixed_sp(element, dims),
		region = {
			sx: fixed.x,
			sy: fixed.y,
			mx: fixed.x + fixed.width,
			my: fixed.y + fixed.height,
		},
		cregion = start_opts.clip ? {
			sx: start_opts.clip.x,
			sy: start_opts.clip.y,
			mx: start_opts.clip.x + start_opts.clip.width,
			my: start_opts.clip.y + start_opts.clip.height,
		} : null,
		mouse_in_region = region.sx <= mouse.x && region.sy <= mouse.y && region.mx >= mouse.x && region.my >= mouse.y,
		region_in_clip = mouse_in_region && start_opts.clip && region.sx >= cregion.sx && region.sy >= cregion.sy && region.mx <= cregion.mx && region.my <= cregion.my;
	
	return start_opts.clip ? false : mouse_in_region;
}