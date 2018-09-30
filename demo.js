function renderHeatMap(data){
  var outData = {max:20,data:[]};
  var i =0
  console.log(data);
  var la1=data[0].header.la1;
  var la2=data[0].header.la2;
  var dy=data[0].header.dy;
  var lo1=data[0].header.lo1;
  var lo2=data[0].header.lo2;
  var dx=data[0].header.dx;
  var i =0;
  for(var lat=la1; lat >= la2; lat-=dy){
    for (var lon=lo1; lon <= lo2; lon+=dx) {
      outData.data.push({
        lat:lat,
        lng:lon,
        count:Math.sqrt(Math.pow(data[0].data[i],2),Math.pow(data[1].data[i],2))
      });
      i++
    }
  }
  console.log(outData);

  var cfg = {
    // radius should be small ONLY if scaleRadius is true (or small radius is intended)
    // if scaleRadius is false it will be the constant radius used in pixels
    "radius": 1,
    "maxOpacity": .7,
    // scales the radius based on map zoom
    "scaleRadius": true,
    // if set to false the heatmap uses the global maximum for colorization
    // if activated: uses the data maximum within the current map boundaries
    //   (there will always be a red spot with useLocalExtremas true)
    "useLocalExtrema": false,
    // which field name in your data represents the latitude - default "lat"
    latField: 'lat',
    // which field name in your data represents the longitude - default "lng"
    lngField: 'lng',
    // which field name in your data represents the data value - default "value"
    valueField: 'count'
  };
  var heatmapLayer = new HeatmapOverlay(cfg);
  heatmapLayer.setData(outData);
  return heatmapLayer;
}

function initDemoMap(){

    var Esri_WorldImagery = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, ' +
        'AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    var Esri_DarkGreyCanvas = L.tileLayer(
        "http://{s}.sm.mapstack.stamen.com/" +
        "(toner-lite,$fff[difference],$fff[@23],$fff[hsl-saturation@20])/" +
        "{z}/{x}/{y}.png",
        {
            attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, ' +
            'NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
        }
    );

    var baseLayers = {
        //"Satellite": Esri_WorldImagery,
        "Grey Canvas": Esri_DarkGreyCanvas
    };

    var map = L.map('map', {
        layers: [ Esri_DarkGreyCanvas ]
    });


    var layerControl = L.control.layers(baseLayers);
    layerControl.addTo(map);
    map.setView([53, -4], 8);

    return {
        map: map,
        layerControl: layerControl
    };
}

// demo map
var mapStuff = initDemoMap();
var map = mapStuff.map;
var layerControl = mapStuff.layerControl;
var foreCastMarker = [];

map.on('click', function(ev) {
  var magnitudes=[WaveHeight={
    X:[],
    Y:[]},
    TimeMarker={
      X:[1,1,1,1,1,1,1],
      Y:[1,2,3,4,5,6,7]
    }];
  if (foreCastMarker.length==0){
    foreCastMarker=L.marker(ev.latlng);
    foreCastMarker.addTo(map);
  } else {
    foreCastMarker.setLatLng(ev.latlng)
  }
  for (var i = 0; i < layerControl._layers.length; i++) {
    var layer = layerControl._layers[i];
    if (layer.overlay && layer.layer._mouseControl){

      var pos = layer.layer._mouseControl.options.leafletVelocity._map.containerPointToLatLng(L.point(ev.containerPoint.x, ev.containerPoint.y));
      var gridVal=layer.layer._mouseControl.options.leafletVelocity._windy.interpolatePoint(pos.lng,pos.lat,'m/s');
      magnitudes[0].Y.push(layer.layer._mouseControl.vectorToSpeed(gridVal[0],[1]));
    }

  }
  console.log(magnitudes)
  Plotly.newPlot('graph', magnitudes);
});


$.post("..\\..\\WeatherData\\ProcessDataRequest.php",
{
  bottom:-90,
  top:90,
  left:-180,
  right:180,
  varID:2,
  parID:2,
  minTime:14,
  maxTime:15
},
function(data){
  var periodLayer = L.velocityLayer({
    displayValues: true,
    displayOptions: {
      velocityType: 'Wave Period',
      displayPosition: 'bottomleft',
      displayEmptyString: 'No data'
    },
    data: JSON.parse(data)[0],
    maxVelocity: 20,
    velocityScale:0.001,
    lineWidth:3
  });
  var heatmap = renderHeatMap(JSON.parse(data)[0]);
  layerControl.addOverlay(heatmap, 'Wave Period heatmap');
  layerControl.addOverlay(periodLayer, 'Wave Period');
});
$.post("..\\..\\WeatherData\\ProcessDataRequest.php",
{
  bottom:-90,
  top:90,
  left:-180,
  right:180,
  varID:1,
  parID:2,
  minTime:14,
  maxTime:15
},
function(data){
  var periodLayer = L.velocityLayer({
    displayValues: true,
    displayOptions: {
      velocityType: 'Wave Height',
      displayPosition: 'bottomleft',
      displayEmptyString: 'No data'
    },
    data: JSON.parse(data)[0],
    maxVelocity: 4,
    velocityScale:0.001,
    lineWidth:3
  });
  var heatmap = renderHeatMap(JSON.parse(data)[0]);
  layerControl.addOverlay(heatmap, 'Wave Height heatmap');
  layerControl.addOverlay(periodLayer, 'Wave Height');
});
