import 'leaflet/dist/leaflet.css'
import './Map.css'
import * as L from 'leaflet'
import  airplane from '../assets/airplane.png'
import 'leaflet-timedimension'
import "leaflet-timedimension/dist/leaflet.timedimension.control.min.css"
import 'leaflet-timedimension/dist/leaflet.timedimension.src.js'
import 'leaflet-rotatedmarker'

import { Component } from 'react'

const data = require('../assets/data.json')

class Map extends Component {
    constructor(props) {
        super(props)
        this.state= {
            map: null,
            index: 0
        }
        this.leafletMap = null
    }

    init(id) {             
        const map = L.map(id, {
            zoom: 18,
            center: [53.22376666666667, 50.745841666666664]
        });
        const baseLayer = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        L.tileLayer(baseLayer).addTo(map); 

        var startDate = new Date();
        startDate.setUTCHours(0, 0, 0, 0);

        // start of TimeDimension manual instantiation
        var timeDimension = new L.TimeDimension({
                period: "PT1M",
            });
        // helper to share the timeDimension object between all layers
        map.timeDimension = timeDimension; 
        // otherwise you have to set the 'timeDimension' option on all layers.

        var player = new L.TimeDimension.Player({
            loop: false,
            startOver:true
        }, timeDimension);

        var timeDimensionControlOptions = {
            player: player,
            timeDimension: timeDimension,
            position: 'bottomleft',
            autoPlay: true,
            timeSliderDragUpdate: true
        };

        L.Control.TimeDimensionCustom = L.Control.TimeDimension.extend({
            _getDisplayDateFormat: function(date){
                var curr_date = date.getDate();
                var curr_month = date.getMonth() + 1; //Months are zero based
                var curr_year = date.getFullYear();
                var hour = date.getHours();
                var minutes = date.getMinutes();
                var sc = date.getSeconds();
                var d = curr_date + "-" + curr_month + "-" + curr_year + " " + hour + ":" + minutes + ":" + sc;
                return d;
            },
            // _getFeatureTimes: function(feature) {
            //     if (feature.properties.hasOwnProperty('times')) {
            //         return feature.properties.times;
            //     }
            //     return [];
            // },
    
            // // Do not modify features. Just return the feature if it intersects
            // // the time interval
            // _getFeatureBetweenDates: function(feature, minTime, maxTime) {
            //     var featureStringTimes = this._getFeatureTimes(feature);
            //     if (featureStringTimes.length === 0) {
            //         return feature;
            //     }
            //     var l = featureStringTimes.length
            //     // for (var i = 0, l = featureStringTimes.length; i < l; i++) {
            //     //     var time = featureStringTimes[i]
            //     //     if (typeof time == 'string' || time instanceof String) {
            //     //         time = Date.parse(time.trim());
            //     //     }
            //     //     featureTimes.push(time);
            //     // }
    
            //     if (featureStringTimes[0] > maxTime || featureStringTimes[l - 1] < minTime) {
            //         return null;
            //     }
            //     return feature;
            // },
        });

        var timeDimensionControl = new L.Control.TimeDimensionCustom(timeDimensionControlOptions);
        this.setState({index: 0})
        map.addControl(timeDimensionControl);

        var icon = L.icon({
            iconUrl: airplane,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
        });

        var customLayer = L.geoJson(data, {
            // onEachFeature: function (feature, layer) {
            //     console.log(timeDimension.getCurrentTime())
            // },
            pointToLayer: function (feature, latLng) {
                if (feature.properties.hasOwnProperty('last')) {
                    var currTime = timeDimension.getCurrentTime()
                    let val = feature.properties.times.reverse().find(e => e <= currTime);
                    var index = feature.properties.times.reverse().indexOf(val)
                    return new L.marker(latLng, {
                        icon: icon,
                        rotationAngle: feature.properties.course[index]
                    });
                }
                return L.circleMarker(latLng);
            }
        });

        var gpxTimeLayer = L.timeDimension.layer.geoJson(customLayer, {
            updateTimeDimension: true,
            addlastPoint: true,
            waitForReady: true
        });

        gpxTimeLayer.addTo(map);
        map.fitBounds(customLayer.getBounds());

        map.timeDimension.on('timeload', function(data) {
            if (data.time === map.timeDimension.getCurrentTime()) {
                // update map bounding box
                map.fitBounds(gpxTimeLayer.getBounds());
            }
        });
        
    }

    componentDidMount() {
        this.init(this.leafletMap);
    }

    render() {
        return (
        <div id="container">
            <div ref={(map) => this.leafletMap = map} id="map" />
        </div>
        )
    }
}

export default Map