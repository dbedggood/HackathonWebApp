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
            var origins = response.originAddresses
            var destinations = response.destinationAddresses

            for (var i = 0; i < origins.length; i++) {
                var results = response.rows[i].elements
                for (var j = 0; j < results.length; j++) {
                    var element = results[j]
                    var duration = element.duration.value
                    var from = origins[i]
                    var to = destinations[j]
                    console.log(
                        'ETA: ' + duration
                    )
                }
            }
        }
    }
}
