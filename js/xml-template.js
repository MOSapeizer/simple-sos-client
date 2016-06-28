function get_observation_xml(obj) {
    return   '<?xml version=\"1.0\" encoding=\"UTF-8\"?>'
           + '<GetObservation'
           +     'xmlns=\"http://www.opengis.net/sos/1.0\"'
           +     'xmlns:ows="http://www.opengis.net/ows/1.1"'
           +     'xmlns:gml="http://www.opengis.net/gml"'
           +     'xmlns:ogc="http://www.opengis.net/ogc"'
           +     'xmlns:om="http://www.opengis.net/om/1.0"'
           +     'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sos/1.0  http://schemas.opengis.net/sos/1.0.0/sosGetObservation.xsd" service="SOS" version="1.0.0">'
           +     '<offering>' + obj.offeringID + '</offering>'
           +     '<eventTime>'
           +         '<ogc:TM_During>'
           +         '<ogc:PropertyName>om:samplingTime</ogc:PropertyName>'
           +         '<gml:TimePeriod>'
           +             '<gml:beginPosition>' + obj.startTime + '</gml:beginPosition>'
           +             '<gml:endPosition>' + obj.endTime + '</gml:endPosition>'
           +         '</gml:TimePeriod>'
           +         '</ogc:TM_During>'
           +     '</eventTime>'
           +     '<observedProperty>' + obj.property + '</observedProperty>'
           +     '<responseFormat>text/xml;subtype="om/1.0.0"</responseFormat>'
           + '</GetObservation>';
}

function get_describe_sensor_xml( procedure ) {
    return '<?xml version="1.0" encoding="UTF-8"?>\
            <swes:DescribeSensor\
                xmlns:swes="http://www.opengis.net/swes/2.0"\
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\
                xmlns:gml="http://www.opengis.net/gml/3.2" service="SOS" version="2.0.0" xsi:schemaLocation="http://www.opengis.net/swes/2.0 http://schemas.opengis.net/swes/2.0/swes.xsd">\
                <swes:procedure>' + procedure + '</swes:procedure>\
                <swes:procedureDescriptionFormat>http://www.opengis.net/sensorML/1.0.1</swes:procedureDescriptionFormat>\
            </swes:DescribeSensor>';
}