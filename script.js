function drawMap(eventLat, eventLng) {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: eventLat, lng: eventLng },
        zoom: 15
    })

    var eventLocation = { lat: eventLat, lng: eventLng }
    var marker = new google.maps.Marker({
        position: eventLocation,
        map: map,
        title: 'Event Location'
    })
}

function getDuration(eventLat, eventLng) {
    var currentLocation
    var eventLocation = new google.maps.LatLng(eventLat, eventLng)
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
            currentLocation = new google.maps.LatLng(
                position.coords.latitude,
                position.coords.longitude
            )
            googleDistance(currentLocation, eventLocation)
        })
    } else {
        console.log('geolocation not available')
    }

    function googleDistance(start, end) {
        var service = new google.maps.DistanceMatrixService()
        service.getDistanceMatrix(
            {
                origins: [start],
                destinations: [end],
                travelMode: 'DRIVING'
            },
            callback
        )
    }

    function callback(response, status) {
        if (status == 'OK') {
            var results = response.rows[0].elements[0]
            var duration = results.duration.value
            document.getElementById('status').innerText = duration + ' seconds away'
        }
    }
}
