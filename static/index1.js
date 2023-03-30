function initMap(){
    const dublin={lat:53.350140,lng:-6.266155};
        map=new google.maps.Map(document.getElementById('map'),{zoom:12,center:dublin,});
        const marker=new google.maps.Marker({
            position:dublin,map:map,
        })
    }
var map;