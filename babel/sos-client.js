let tgos;
let capaiblity_xml;
let reading_group = {};
let maker_images = { 
	"swcb-sos-new/service": "http://210.65.11.194/TGOS_API/images/marker.png",
  	"epa-sos/service": "http://i.imgur.com/XExhkhs.png?2" };

function create_map() {
	let map_element = document.getElementById("TGMap");
	tgos = new TGOS.TGOnlineMap(map_element, TGOS.TGCoordSys.EPSG3857);
}

function Reading( info ) {
    this.feature_of_interest = info.feature;
    this.last_time = info.last_time;
    this.last_result = info.last_result;
    this.latitude = info.lower_corner[1];
    this.longitude = info.lower_corner[0];
    this.observations = info.observations || [];
    this.property = info.property;
    this.uom = info.uom;
}

function get_capability( url ) {
	let xmlhttp = create_xmlhttp( parse_capability );
	xmlhttp.open("GET", url+"?service=SOS&request=GetCapabilities", true);
	xmlhttp.send();
}

function parse_capability( file ) {
	capaiblity_xml = create_xml_reader( file );
	let operations = parse_tag.call( capaiblity_xml, "Operation", "GetObservation" );
	document.getElementById("offeringID").innerHTML = parse_offering_values( operations );
	document.getElementById("property").innerHTML = parse_propety_values( operations );

	// 同樣的方式，但比較不好讀的版本
	// let operations = xml_dom.getElementsByTagName("Operation");
	// operations.forEach((operation) => {
	// 	if( operation.getAttribute('name') == "GetObservation" ){

	// 		parameters = operation.getElementsByTagName("Parameter");
	// 		parameters.forEach((parameter) => {
	// 			let tag_name = parameter.getAttribute('name')
	// 			if( tag_name == "offering" ){
	// 				let values = parameter.getElementsByTagName("Value");
	// 				values.forEach((value) => {
	// 					let node_value = value.childNodes[0].nodeValue;
	// 					str += '<option value=' + node_value + '>'
	// 						 + 		node_value 
	// 						 + '</option>';
	// 				});
	// 			}
	// 			else if( tag_name =="observedProperty" ){
	// 				let values = parameter.getElementsByTagName("Value");
	// 				values.forEach((value) => {
	// 					let node_value = value.childNodes[0].nodeValue;
	// 					str2 += '<option>' + node_value + '</option>';
	// 				});
	// 			}
	// 		});
	// 	}
	// });
}

function update_time(offering) {
	find_tag.call( capaiblity_xml, "offering", (tag) => {
		let id = tag.getElementsByTagName("identifier")[0];
		let offering_name = node_value( id );
		if ( offering_name == offering)
			document.getElementById("startTime").value = node_value( tag, "beginPosition" );
			document.getElementById("endTime").value = node_value( tag, "endPosition" );
	});
}

function get_observation() {

	// clean up old data.
	["resultTable", "container", "describesensor"].forEach((id) => {
		document.getElementById( id ).innerHTML = '';
	});

	// get info of request.
	let info = {};
	["sosURL", "offeringID", "property", "startTime", "endTime"].forEach((id) =>{
		info[id] = document.getElementById(id).value;
	});
    
    let request_body = get_observation_xml( info );
    let xmlhttp = create_xmlhttp( get_observation_handler );
    xmlhttp.open("POST", info.sosURL, true);
    xmlhttp.setRequestHeader("Content-type", "application/xml");
    xmlhttp.send( request_body );
}

function get_observation_handler( response ) {

    if ( response.indexOf('exception') ){
    	console.log('There is a exception in GET observation response');
    	return ;
    }

    let xml_dom = create_xml_reader( response );
    let feature_of_interest = parse_get_observation_response( xml_dom );
    add_marker( feature_of_interest );
	draw_chart( feature_of_interest );
}

function parse_get_observation_response( xml_dom ) {
    let info = collect_info( xml_dom );
    let reading = new Reading( info );
    reading_group[ info.feature ] = reading; 
    return info.feature;
}

function add_marker( feature_of_interest ) {
	let point = new TGOS.TGPoint(reading.lon, reading.lat);
    let reading = reading_group[ feature_of_interest ];
    let marker = create_marker( point, reading.observations );
    let info_window_options = {
            maxWidth: 3000,
            pixelOffset: new TGOS.TGSize(5, -30),
            zIndex: 99
        };
    let service = document.getElementById("sosURL").value;
    let info_window = new TGOS.TGInfoWindow( info_window_message(service), point, info_window_options);
    TGOS.TGEvent.addListener( marker , "click", () => {
    	info_window.open( tgos, marker );
    	drawChart( marker.getTitle()[0][3] );
    });
    TGOS.TGEvent.addListener( marker, "rightclick", () => {
    	info_window.close(tgos, marker);
    });
}

function create_describe_sensor_element( response ) {
	let node = document.createElement('textarea');
	node.setAttribute('rows', '100');
	node.setAttribute('cols', '100');
	node.value = response;
	document.getElementById("describesensor").innerHTML = "<h4><b>感測器描述文檔</b></h4>";
    document.getElementById("describesensor").appendChild( node );
}

function describe_sensor( service, procedure ){
	let request_body = get_describe_sensor_xml( procedure );
    let xmlhttp = create_xmlhttp( create_describe_sensor_element );
    xmlhttp.open("POST", service, true);
    xmlhttp.setRequestHeader("Content-type", "application/xml");
    xmlhttp.send( request_body );
}

function draw_chart( feature_of_interest ) {

    let reading = reading_group[ feature_of_interest ];
    let property = reading.property;
    if (reading.property.indexOf(":") > -1) {
        property_full = reading.property.split(":");
        property = property_full[ property_full.length - 1 ];
    }

    $(function() {
        $('#container').highcharts({
            chart: { zoomType: 'x' },
            title: { text: '時間序列' },
            xAxis: {
                type: 'datetime',
                title: { text: '時間' } },
            yAxis: {
                title: { text: property + ' (' + reading.uom + ')' },
                min: 0 },
            tooltip: {
                pointFormat: '<span style="color:{point.color}">\u25CF</span>{point.x:' + property + '}: <b>{point.y:.2f} ' + reading.uom + '</b>' },
            plotOptions: { spline: { marker: { enabled: true } } },
            series: [{
                name: property,
                data: reading.observations
            }]
        });
    });
}