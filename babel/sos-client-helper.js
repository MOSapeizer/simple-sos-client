function check_brower_xmlhttp() {
	// support for IE7+, chrome, opera, safari, firefox;
	if (window.XMLHttpRequest)
		return new XMLHttpRequest();
	// IE6 SUCKS;
	return new ActiveXObject("Microsoft.XMLHTTP");
}

function create_xmlhttp( response_callback ) {
	let xmlhttp = check_brower_xmlhttp();
	xmlhttp.onreadystatechange = () => {
		(xmlhttp.readyState == 4) && (xmlhttp.status == 200) && response_callback(xmlhttp.responseText);
	}
	return xmlhttp;
}


function create_xml_reader( xml ) {
	// support for IE7+, chrome, opera, safari, firefox;
	if(window.DOMParser) 
		return new DOMParser().parseFromString( xml,"text/xml" );
	// IE SUCKS;
	let xml_dom = new ActiveXObject( "Microsoft.XMLDOM" );
	xml_dom.async=false;
	xml_dom.loadXML( xml ); 
	return xml_dom;
}

function find_tag( name, callback ){
	let tags = this.getElementsByTagName( name );
	callback && tags.forEach((tag) => {
		callback(tag);
	})
	return tags;
}

function find_tag_attribute(tag, attr){
	let tags_attr = [];
	let tags = this.getElementsByTagName( tag );
	if( tags.length == 1 )
		return tags[0].getAttribute(attr);
	tags.forEach((t) => {
		let attr = t.getAttribute(attr)
		tags_attr.push( attr );
	});
	return tags_attr;
}

function node(tag_name){
	let tags = this.getElementsByTagName( tag_name );
	if( tags.length == 1)
		return tags[0];
	return tags;
}

function nodes_value( tags, child_name ){
	return tags.map((tag) => {
		if( child_name )
			return node_value(tag, child_name);
		return node_value(tag);
	});
}

function node_value( tag, child_name ){
	if( child_name )
		return tag.getElementsByTagName(child_name)[0].childNodes[0].nodeValue;
	return tag.childNodes[0].nodeValue;
}

function parse_tag( tag, condition ){
	let tags_buff = [];
	let child_tags = this.getElementsByTagName( tag );
	child_tags.forEach((child) => {
		if( child.getAttribute('name') == condition )
			tags_buff.push( child );
	});
	return tags_buff;
}

function group_tags( tag, condition ){
	let tags_buff = [];
	this.forEach((child) => {
		let tags = parse_tag.call(child, tag, condition);
		tags_buff.concat( tags );
	})
	return tags_buff;
}

function get_tag_value( tag ){
	let values_buff = [];
	let values = tag.getElementsByTagName("Value");
	values.forEach((value) => {
		let node_value = value.childNodes[0].nodeValue;
		values_buff.push( node_value );
	});
	return values_buff;
}

function group_tags_value( tags=[] ) {
	let values_buff = [];
	tags.forEach((tag) => {
		let values = get_tag_value( tag );
		values_buff.concat( values );
	});
	return values_buff;
}

function join_with_wrap(wrap){
	let str = "";
	this.forEach((child) => {
		str += wrap( child );
	});
	return str;
}

function parse_offering_values( operations ){
	let str = "<option>Please select a URL</option>";
	let offerings = group_tags.call( operations, "Parameter", "offering" );
	let offering_values = group_tags_value( offerings );
	str += join_with_wrap.call( offering_values, (offering) =>{
		return '<option value=\"' + offering + '\">' 
			 +		offering
			 + '</option>';
	});
	return str;
}

function parse_propety_values( operations ){
	let str = ""
	let properties = group_tags.call( operations, "Parameter", "observedProperty" );
	let properties_values = group_tags_value( properties );
	str += join_with_wrap.call( properties, (property) =>{
		return '<option>' +	property + '</option>';
	});
	return str;
}

function create_time_result_pair(xml){
	let result = node.call( xml, "result" );
    let timestamps = node.call( xml, "timePosition" );
    return timestamps.map((timestamp, index) => {
    	return timestamp + " " + result[index];
    });
}

function get_last_pair( time_result_pairs ){
    let last_pair = time_result_pairs[ time_result_pairs.length -1 ];
    return last_pair.split(" ");
}

function collect_info( xml ) {
	let info = {};
	let time_result_pairs = create_time_result_pair( xml ).sort();
	let last_pair = get_last_pair( time_result_pairs );
	let sampling_point = find_tag.call( xml, 'SamplingPoint' )[0];
    info.feature = node_value( sampling_point, 'name' );
    info.procedure = find_tag_attribute.call( xml, 'procedure', 'xlink:href');
    info.property = find_tag_attribute.call( xml, 'observedProperty', 'xlink:href');
    info.uom = find_tag_attribute.call( xml, 'result', 'uom');
    info.lower_corner = node_value( xml , "lowerCorner").split(" ");
    info.last_time = last_pair[0].replace('GMT+0800 (台北標準時間)', '');
    info.last_result = last_pair[1];
    info.observations = collect_observations( time_result_pairs );
	return info;
}

function collect_observations( time_result_pairs ){
	let observations = [];
	time_result_pairs.forEach((time_result_pair) =>{
    	let pair = time_result_pair.split(" ");
    	let timestamp = new Date( pair[0].replace('.000', '') );
    	let result = pair[1];
    	let numeric_time = Number( timestamp );
    	let numeric_result = Number( result );
    	let observation = {};
    	observation.timestamp = timestamp;
    	observation.result = result;
    	observation.feature = feature;
    	observation.property = property;
    	observation.procedure = procedure;
    	observations.push( observation );
    });
    return observations;
}

function get_marker_image(){
	let service = document.getElementById("sosURL").value;
	service = service.replace("http://cgis.csrsr.ncu.edu.tw:8080/", '');
    let image_info = maker_images[service] || "http://cgis.csrsr.ncu.edu.tw:8080/epa-aqx-sos/service";
    return image_info;
}

function create_marker( point, observations ){
	let image_info = get_marker_image();
	let marker_info = new TGOS.TGImage( image_info,
				            			new TGOS.TGSize(38, 33), 
				            			new TGOS.TGPoint(0, 0),
				            			new TGOS.TGPoint(10, 33));
	return new TGOS.TGMarker(tgos, point, observations, marker_info);
}

function info_window_message( service ) {
	return '<b>' + feature_of_interest + '</b>' 
		 + " = " + reading.lastValue + " " + reading.uom + " @ " + reading.lastTime + '</br>' 
		 + '<a href="javascript:describe_sensor(\'' + service +'\',\'' 
		 + marker.getTitle()[0][4] + '\')"> 取得感測器描述文檔 </a>';
}