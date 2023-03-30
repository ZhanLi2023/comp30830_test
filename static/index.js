function initMap(){
    const dublin={ lat:53.350140, lng:-6.266155};
        map=new google.maps.Map(document.getElementById("map"),{
            zoom:12,
            center:dublin,
        });
        const marker=new google.maps.Marker({
            position:dublin,map:map,
        });
        getStations();
    }
// var map;
// window.initMap=initMap;

// var test;
// function marker(){
//         fetch("https://api.jcdecaux.com/vls/v1/stations?contract=Dublin&apiKey=9d55c6cd0e9961febb4a8d1430262600db3ddd3d")
//   .then((response) => response.json())
//   .then((data) => test)
// }
// console.log(test)
function addMarkers(stations){
    for(const station of stations){
        console.log('station:', station);
        var marker=new google.maps.Marker({
            position:{
                lat:station.position_lat,
                lng:station.position_lng,
            },
            map:map,
            title:station.name,
            station_number:station.number,
        });
    }
}
function getStations(){
        fetch("/stations")
  .then((response) => response.json())
  .then((data) => addMarkers(data));
}
var map=null;
window.initMap=initMap;
