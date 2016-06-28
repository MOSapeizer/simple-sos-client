"use strict";

function check_brower_xmlhttp() {
	// support for IE7+, chrome, opera, safari, firefox;
	if (window.XMLHttpRequest) return new XMLHttpRequest();
	// IE6 SUCKS;
	return new ActiveXObject("Microsoft.XMLHTTP");
}

function create_xmlhttp(response_callback) {
	var xmlhttp = check_brower_xmlhttp();
	xmlhttp.onreadystatechange = function () {
		xmlhttp.readyState == 4 && xmlhttp.status == 200 && response_callback(xmlhttp.responseText);
	};
	return xmlhttp;
}

function create_xml_reader(xml) {
	// support for IE7+, chrome, opera, safari, firefox;
	if (window.DOMParser) return new DOMParser().parseFromString(xml, "text/xml");
	// IE SUCKS;
	var xml_dom = new ActiveXObject("Microsoft.XMLDOM");
	xml_dom.async = false;
	xml_dom.loadXML(xml);
	return xml_dom;
}

function find_tag(name, callback) {
	var tags = this.getElementsByTagName(name);
	callback && tags.forEach(function (tag) {
		callback(tag);
	});
	return tags;
}

function find_tag_attribute(tag, attr) {
	var tags_attr = [];
	var tags = this.getElementsByTagName(tag);
	if (tags.length == 1) return tags[0].getAttribute(attr);
	tags.forEach(function (t) {
		var attr = t.getAttribute(attr);
		tags_attr.push(attr);
	});
	return tags_attr;
}

function node(tag_name) {
	var tags = this.getElementsByTagName(tag_name);
	if (tags.length == 1) return tags[0];
	return tags;
}

function nodes_value(tags, child_name) {
	return tags.map(function (tag) {
		if (child_name) return node_value(tag, child_name);
		return node_value(tag);
	});
}

function node_value(tag, child_name) {
	if (child_name) return tag.getElementsByTagName(child_name)[0].childNodes[0].nodeValue;
	return tag.childNodes[0].nodeValue;
}

function parse_tag(tag, condition) {
	var tags_buff = [];
	var child_tags = this.getElementsByTagName(tag);
	child_tags.forEach(function (child) {
		if (child.getAttribute('name') == condition) tags_buff.push(child);
	});
	return tags_buff;
}

function group_tags(tag, condition) {
	var tags_buff = [];
	this.forEach(function (child) {
		var tags = parse_tag.call(child, tag, condition);
		tags_buff.concat(tags);
	});
	return tags_buff;
}

function get_tag_value(tag) {
	var values_buff = [];
	var values = tag.getElementsByTagName("Value");
	values.forEach(function (value) {
		var node_value = value.childNodes[0].nodeValue;
		values_buff.push(node_value);
	});
	return values_buff;
}

function group_tags_value() {
	var tags = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

	var values_buff = [];
	tags.forEach(function (tag) {
		var values = get_tag_value(tag);
		values_buff.concat(values);
	});
	return values_buff;
}

function join_with_wrap(wrap) {
	var str = "";
	this.forEach(function (child) {
		str += wrap(child);
	});
	return str;
}

function parse_offering_values(operations) {
	var str = "<option>Please select a URL</option>";
	var offerings = group_tags.call(operations, "Parameter", "offering");
	var offering_values = group_tags_value(offerings);
	str += join_with_wrap.call(offering_values, function (offering) {
		return '<option value=\"' + offering + '\">' + offering + '</option>';
	});
	return str;
}

function parse_propety_values(operations) {
	var str = "";
	var properties = group_tags.call(operations, "Parameter", "observedProperty");
	var properties_values = group_tags_value(properties);
	str += join_with_wrap.call(properties, function (property) {
		return '<option>' + property + '</option>';
	});
	return str;
}

function create_time_result_pair(xml) {
	var result = node.call(xml, "result");
	var timestamps = node.call(xml, "timePosition");
	return timestamps.map(function (timestamp, index) {
		return timestamp + " " + result[index];
	});
}

function get_last_pair(time_result_pairs) {
	var last_pair = time_result_pairs[time_result_pairs.length - 1];
	return last_pair.split(" ");
}

function collect_info(xml) {
	var info = {};
	var time_result_pairs = create_time_result_pair(xml).sort();
	var last_pair = get_last_pair(time_result_pairs);
	var sampling_point = find_tag.call(xml, 'SamplingPoint')[0];
	info.feature = node_value(sampling_point, 'name');
	info.procedure = find_tag_attribute.call(xml, 'procedure', 'xlink:href');
	info.property = find_tag_attribute.call(xml, 'observedProperty', 'xlink:href');
	info.uom = find_tag_attribute.call(xml, 'result', 'uom');
	info.lower_corner = node_value(xml, "lowerCorner").split(" ");
	info.last_time = last_pair[0].replace('GMT+0800 (台北標準時間)', '');
	info.last_result = last_pair[1];
	info.observations = collect_observations(time_result_pairs);
	return info;
}

function collect_observations(time_result_pairs) {
	var observations = [];
	time_result_pairs.forEach(function (time_result_pair) {
		var pair = time_result_pair.split(" ");
		var timestamp = new Date(pair[0].replace('.000', ''));
		var result = pair[1];
		var numeric_time = Number(timestamp);
		var numeric_result = Number(result);
		var observation = {};
		observation.timestamp = timestamp;
		observation.result = result;
		observation.feature = feature;
		observation.property = property;
		observation.procedure = procedure;
		observations.push(observation);
	});
	return observations;
}

function get_marker_image() {
	var service = document.getElementById("sosURL").value;
	service = service.replace("http://cgis.csrsr.ncu.edu.tw:8080/", '');
	var image_info = maker_images[service] || "http://cgis.csrsr.ncu.edu.tw:8080/epa-aqx-sos/service";
	return image_info;
}

function create_marker(point, observations) {
	var image_info = get_marker_image();
	var marker_info = new TGOS.TGImage(image_info, new TGOS.TGSize(38, 33), new TGOS.TGPoint(0, 0), new TGOS.TGPoint(10, 33));
	return new TGOS.TGMarker(tgos, point, observations, marker_info);
}

function info_window_message(service) {
	return '<b>' + feature_of_interest + '</b>' + " = " + reading.lastValue + " " + reading.uom + " @ " + reading.lastTime + '</br>' + '<a href="javascript:describe_sensor(\'' + service + '\',\'' + marker.getTitle()[0][4] + '\')"> 取得感測器描述文檔 </a>';
}