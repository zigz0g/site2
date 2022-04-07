var ut = exports;

ut.add_ele = (node_name, parent, attributes) => Object.assign(parent.appendChild(document.createElement(node_name)), attributes);

ut.sanatize_buffer = ut.add_ele('div', document.body, { style: 'display: none' });

ut.sanatize = str => {
	sanatize_buffer.appendChild(document.createTextNode(str));
	var clean = sanatize_buffer.innerHTML;
	
	sanatize_buffer.innerHTML = '';
	
	return clean;
};

ut.unsanatize = str => {
	sanatize_buffer.innerHTML = str;
	var clean = sanatize_buffer.textContent;
	
	sanatize_buffer.innerHTML = '';
	
	return clean;
};

/*ut.text_buffer = ut.add_ele('div', document.body, { style: 'display: none' });

ut.canvas_text_measure = data => {
	var result = {};
	
	ut.text_buffer.textContent = data.text;
	ut.text_buffer.style.verticalAlign = 'baseline';
	
};*/