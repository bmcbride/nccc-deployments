var map, featureList, activeRecord;

var hiddenSystemFields = ["Created At", "Updated At", "Created By", "Updated By", "System Created At", "System Updated At", "Version", "Project", "Assigned To", "Latitude", "Longitude", "Gps Altitude", "Gps Horizontal Accuracy", "Gps Vertical Accuracy", "Gps Speed", "Gps Course", "Address Sub Thoroughfare", "Address Thoroughfare", "Address Locality", "Address Sub Admin Area", "Address Admin Area", "Address Postal Code", "Address Suite", "Address Country"];
var hiddenUserFields = ["Photos", "Photos Caption", "Videos", "Videos Caption", "Signatures", "Signatures Caption"];

var urlParams = {};

if (location.search) {
  var parts = location.search.substring(1).split("&");
  for (var i = 0; i < parts.length; i++) {
    var nv = parts[i].split("=");
    if (!nv[0]) continue;
    urlParams[nv[0]] = nv[1] || true;
  }
}

/* Basemap Layers */
var mapboxOSM = L.tileLayer("http://{s}.tiles.mapbox.com/v3/spatialnetworks.map-6l9yntw9/{z}/{x}/{y}.jpg70", {
  maxZoom: 19,
  subdomains: ["a", "b", "c", "d"],
  attribution: 'Basemap <a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox © OpenStreetMap</a>'
});
var mapboxSat = L.tileLayer("http://{s}.tiles.mapbox.com/v3/spatialnetworks.map-xkumo5oi/{z}/{x}/{y}.jpg70", {
  maxZoom: 19,
  subdomains: ["a", "b", "c", "d"],
  attribution: 'Basemap <a href="https://www.mapbox.com/about/maps/" target="_blank">© Mapbox © OpenStreetMap</a>'
});

/* Overlay Layers */
var highlight = L.geoJson(null);

var regions = L.geoJson(null, {
  style: function (feature) {
    if (feature.properties.region === "Atlantic") {
      return {
        clickable: false,
        color: "white",
        weight: 1,
        opacity: 1,
        fillColor: "#0A9F49",
        fillOpacity: 0.5
      };
    }
    else if (feature.properties.region === "North Central") {
      return {
        clickable: false,
        color: "white",
        weight: 1,
        opacity: 1,
        fillColor: "#F2EB17",
        fillOpacity: 0.5
      };
    }
    else if (feature.properties.region === "Pacific") {
      return {
        clickable: false,
        color: "white",
        weight: 1,
        opacity: 1,
        fillColor: "#EB1B22",
        fillOpacity: 0.5
      };
    }
    else if (feature.properties.region === "Southern") {
      return {
        clickable: false,
        color: "white",
        weight: 1,
        opacity: 1,
        fillColor: "#2D3091",
        fillOpacity: 0.5
      };
    }
    else if (feature.properties.region === "Southwest") {
      return {
        clickable: false,
        color: "white",
        weight: 1,
        opacity: 1,
        fillColor: "#DD8026",
        fillOpacity: 0.5
      };
    }
  }
});
$.getJSON("assets/data/regions.geojson", function (data) {
  regions.addData(data);
});

var markerClusters = new L.MarkerClusterGroup({
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true
});

var femaCorpsListener = L.geoJson(null);
var ameriCorpsListener = L.geoJson(null);
var femaCorps = L.geoJson(null);
var ameriCorps = L.geoJson(null);

var deployments = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      title: feature.properties.Team,
      riseOnHover: true
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      if (feature.properties.Status === "FEMA Corps") {
        layer.setIcon(
          L.icon({
            iconUrl: "assets/img/red-marker.png",
            iconSize: [30, 44],
            iconAnchor: [15, 34],
            popupAnchor: [0, -40]
          })
        );
        femaCorps.addLayer(layer);
        $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '"><td class="feature-name">' + layer.feature.properties.Team + '<img class="pull-left" src="assets/img/red-marker-no-shadow.png" width="15" height="22" style="margin-right: 5px;"></td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      }
      if (feature.properties.Status === "AmeriCorps") {
        layer.setIcon(
          L.icon({
            iconUrl: "assets/img/blue-marker.png",
            iconSize: [30, 44],
            iconAnchor: [15, 34],
            popupAnchor: [0, -40]
          })
        );
        ameriCorps.addLayer(layer);
        $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '"><td class="feature-name">' + layer.feature.properties.Team + '<img class="pull-left" src="assets/img/blue-marker-no-shadow.png" width="15" height="22" style="margin-right: 5px;"></td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      }
      var content = "<table class='table table-striped table-bordered table-condensed'>";
      $.each(feature.properties, function(index, prop) {
        if (prop === null) {
          prop = "";
        } else if (prop.toString().indexOf("https://web.fulcrumapp.com/shares/" + urlParams.id + "/photos/") === 0) {
          prop = "<a href='" + prop + "' target='blank'>View photos</a>";
        } else if (prop.toString().indexOf("https://web.fulcrumapp.com/shares/" + urlParams.id + "/videos/") === 0) {
          prop = "<a href='" + prop + "' target='blank'>View videos</a>";
        } else if (prop.toString().indexOf("https://web.fulcrumapp.com/shares/" + urlParams.id + "/signatures/") === 0) {
          prop = "<a href='" + prop + "' target='blank'>View signatures</a>";
        }
        if ($.inArray(index, hiddenSystemFields) == -1 && $.inArray(index, hiddenUserFields) == -1 && index !== "Fulcrum Id") {
          content += "<tr><th>" + index + "</th><td>" + prop + "</td></tr>";
        }
      });
      content += "<table>";
      layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties.Team);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          activeRecord = feature.properties["Fulcrum Id"];
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
            stroke: false,
            fillColor: "#00FFFF",
            fillOpacity: 0.7,
            radius: 10
          }));
        }
      });
    }
  }
});


$(document).on("click", ".feature-row", function(e) {
  sidebarClick(parseInt($(this).attr('id')));
});

$(document).ready(function() {
  fetchRecords();
});

$("#refresh-btn").click(function() {
  fetchRecords();
  return false;
});

$("#full-extent-btn").click(function() {
  map.fitBounds(regions.getBounds());
  return false;
});

$("#list-btn").click(function() {
  $('#sidebar').toggle();
  map.invalidateSize();
  return false;
});

$("#nav-btn").click(function() {
  $(".navbar-collapse").collapse("toggle");
  return false;
});

$("#sidebar-toggle-btn").click(function() {
  $("#sidebar").toggle();
  map.invalidateSize();
  return false;
});

$("#sidebar-hide-btn").click(function() {
  $('#sidebar').hide();
  map.invalidateSize();
});

$("#share-btn").click(function() {
  var link = location.toString() + "?id=" + activeRecord;
  $("#share-hyperlink").attr("href", link);
  $("#share-twitter").attr("href", "https://twitter.com/intent/tweet?url=" + link);
  $("#share-facebook").attr("href", "https://facebook.com/sharer.php?u=" + link);
});

function zoomToFeature(id) {
  markerClusters.eachLayer(function (layer) {
    if (layer.feature.properties["Fulcrum Id"] == id) {
      map.setView([layer.getLatLng().lat, layer.getLatLng().lng], 12);
      layer.fire("click");
    }
  });
}

function sidebarClick(id) {
  if (!map.hasLayer(markerClusters)) {
    map.addLayer(markerClusters);
  }
  var layer = markerClusters.getLayer(id);
  map.setView([layer.getLatLng().lat, layer.getLatLng().lng], 12);
  layer.fire("click");
  /* Hide sidebar and go to the map on small screens */
  if (document.body.clientWidth <= 767) {
    $("#sidebar").hide();
    map.invalidateSize();
  }
}

function fetchRecords() {
  $("#loading").show();
  highlight.clearLayers();
  femaCorps.clearLayers();
  ameriCorps.clearLayers();
  markerClusters.clearLayers();
  $("#feature-list tbody").empty();
  $.getJSON("https://web.fulcrumapp.com/shares/7936299bd87f5566.geojson?human_friendly=true", function (data) {
    deployments.addData(data);
    markerClusters.addLayer(femaCorps);
    markerClusters.addLayer(ameriCorps);
    if (!featureList) {
      featureList = new List("features", {valueNames: ["feature-name"]});
    }
    featureList.sort("feature-name", {order:"asc"});
    $("#loading").hide();
  });
}

map = L.map("map", {
  zoom: 10,
  layers: [mapboxOSM, regions, femaCorpsListener, ameriCorpsListener, markerClusters, highlight],
  zoomControl: false
}).fitWorld();
map.attributionControl.setPrefix("Powered by <a href='http://fulcrumapp.com/' target='_blank'>Fulcrum</a>");

/* Clear feature highlight when map is clicked */
map.on("click", function(e) {
  highlight.clearLayers();
});

/* Layer control listeners that allow for a single markerClusters layer */
map.on("overlayadd", function(e) {
  if (e.layer === femaCorpsListener) {
    markerClusters.addLayer(femaCorps);
  }
  if (e.layer === ameriCorpsListener) {
    markerClusters.addLayer(ameriCorps);
  }
});

map.on("overlayremove", function(e) {
  if (e.layer === femaCorpsListener) {
    markerClusters.removeLayer(femaCorps);
  }
  if (e.layer === ameriCorpsListener) {
    markerClusters.removeLayer(ameriCorps);
  }
});

var zoomControl = L.control.zoom({
  position: "bottomright"
}).addTo(map);

/* GPS enabled geolocation control set to follow the user's location */
var locateControl = L.control.locate({
  position: "bottomright",
  drawCircle: true,
  follow: true,
  setView: true,
  keepCurrentZoomLevel: true,
  markerStyle: {
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.8
  },
  circleStyle: {
    weight: 1,
    clickable: false
  },
  icon: "icon-direction",
  metric: false,
  strings: {
    title: "My location",
    popup: "You are within {distance} {unit} from this point",
    outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
  },
  locateOptions: {
    maxZoom: 18,
    watch: true,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 10000
  }
}).addTo(map);

/* Larger screens get expanded layer control and visible sidebar */
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
}

var baseLayers = {
  "Street Map": mapboxOSM,
  "Aerial Imagery": mapboxSat
};

var overlays = {
  "<img src='assets/img/red-marker-no-shadow.png' width='15' height='22'> FEMA Corps": femaCorpsListener,
  "<img src='assets/img/blue-marker-no-shadow.png' width='15' height='22'> AmeriCorps": ameriCorpsListener,
  'Deployment Regions<br><svg xmlns="http://www.w3.org/2000/svg" height="75" width="110"><g><rect x="10" y="10" width="20" height="10" fill="#0A9F49" fill-opacity="0.5"></rect><text x="32" y="20" font-size="12" fill="#333">Atlantic</text><rect x="10" y="22" width="20" height="10" fill="#F2EB17" fill-opacity="0.5"></rect><text x="32" y="32" font-size="12" fill="#333">North Central</text><rect x="10" y="34" width="20" height="10" fill="#EB1B22" fill-opacity="0.5"></rect><text x="32" y="44" font-size="12" fill="#333">Pacific</text><rect x="10" y="46" width="20" height="10" fill="#2D3091" fill-opacity="0.5"></rect><text x="32" y="55" font-size="12" fill="#333">Southern</text><rect x="10" y="58" width="20" height="10" fill="#DD8026" fill-opacity="0.5"></rect><text x="32" y="66" font-size="12" fill="#333" >Southwest</text></g></svg>': regions
};

var layerControl = L.control.layers(baseLayers, overlays, {
  collapsed: isCollapsed
}).addTo(map);


/* After GeoJSON loads */
$(document).one("ajaxStop", function () {
  $("#loading").hide();

  /* If fulcrum_id param passed in URL, zoom to feature, else fit to cluster bounds */
  if (urlParams.id && urlParams.id.length > 0) {
    zoomToFeature(urlParams.id);
  } else {
    map.fitBounds(regions.getBounds());
  }


});
