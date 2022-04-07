// load libraries
var ui = require('/lib/ui.js'),
	dom_utils = require('/lib/dom-utils.js'),
	rasterize_html = require('/var/lib/rasterize-html.js');

// window creation options
exports.opts = {
	width: 600,
	height: 400,
	x: ui.align.middle,
	y: ui.align.middle,
};

exports.open = (window, data) => {
	var browser = {
			add_proto: url => (!/^.*?:/.test(url)) ? 'https://' + url : url,
			valid_url: url => { try{ return new URL(url) }catch(err){ return null }},
			win: window,
			nav_rect: window.content.append(new ui.rect({
				width: '100%',
				height: 35,
				get color(){
					return window.title_bar.color;
				},
			})),
			nav: {
				history: {},
				url: 'https://www.example.org',
			},
			render: async () => {
				var vurl = browser.add_proto(browser.nav.url),
					data = await fetch(/^https?:\/{2}/.test(vurl) ? 'https://ldm.sys32.dev/studyflow/' + vurl : vurl).then(res => res.text()).catch(err =>
						`<p>error visiting ${vurl}:</p>\n<pre>${err}</pre>`
					),
					buf = dom_utils.add_ele('canvas', document.body, { style: 'display: none' });
				
				// https://github.com/cburgmer/rasterizeHTML.js/wiki/API
				
				rasterize_html.drawHTML(data, buf, {
					width: browser.rendering.fixed.width,
					height: browser.rendering.fixed.height,
					baseUrl: browser.valid_url(vurl) ? browser.valid_url(vurl).origin : null,
					executeJs: true,
					zoom: 0.8,
				}).then(result => {
					browser.rendering.image = result.image;
					
					buf.remove();
				});
				
				browser.nav.url_bar.value = vurl;
			},
		};

	browser.nav.url_bar = browser.nav_rect.append(new ui.input({
		placeholder: 'Search or enter web address',
		width: '80%',
		height: 25,
		offset: {
			x: 5,
			width: -10,
		},
		value: browser.nav.url,
		x: '20%',
		y: ui.align.middle,
	}));

	browser.nav.history_rect = browser.nav_rect.append(new ui.element({
		width: '20%',
		height: 25,
		offset: {
			x: 2,
			width: -5,
		},
		x: 5,
		y: ui.align.middle,
	}));

	browser.nav.history.back = browser.nav.history_rect.append(new ui.button({
		width: '50%',
		height: '100%',
		x: 0,
		y: ui.align.middle,
		auto_width: false,
		offset: {
			width: -2,
		},
		text: '←',
	}));

	browser.nav.history.forward = browser.nav.history_rect.append(new ui.button({
		width: '50%',
		height: '100%',
		x: '50%',
		y: ui.align.middle,
		auto_width: false,
		offset: {
			width: -2,
			x: 2,
		},
		text: '→',
	}));

	browser.nav.url_bar.on('submit', () => {
		browser.nav.url = browser.nav.url_bar.value;
		
		browser.render();
	});

	browser.rendering = window.content.append(new ui.image({
		width: '100%',
		height: '100%',
		y: 35,
		offset: {
			height: -35,
		},
	}));

	browser.render();
};