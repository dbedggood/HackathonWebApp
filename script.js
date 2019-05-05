const BASE_URL = 'https://hackathon-239523.appspot.com'
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
async function pull_events() {
    let response = await fetch(BASE_URL + '/events/');
    let events = await response.json();

    let container = document.querySelector("div#events");
    events.forEach(i => {
        let el = document.createElement('a');
        el.href = `./event.html?event=${i.event_id}`;
        el.className = 'btn btn-info';
        el.innerText = i.event_name;

        container.append(el);
        container.append(document.createElement('hr'));
    })
}

async function submit_event() {

    const eventObj = {
        event_name: document.querySelector("input#event-name").value,
        start_time: document.querySelector("input#start-time").value,
        event_description: document.querySelector("textarea#event-description").value
    };
    try {
        let response = await fetch(`${BASE_URL}/events?event=${btoa(JSON.stringify(eventObj))}`, { method: 'post' });
        alert('Event Successfully Added!');
    } catch (err) {
        console.debug(err);
        alert("An error occured. Sorry about that.");
    }

}
async function check_user(){
    if (!localStorage.getItem('person_id')){
        let person_name = prompt("Hi there - It doesn't look like we've seen you before. Enter your name to continue:");
        let response = await fetch(`${BASE_URL}/people/?person_id=${person_name}`,{method:'post'})
        let z = await response.json()
        localStorage.setItem('person_id',z[0].person_id)
    }
}


window.onload = () => {
    check_user();
    pull_events();
    document.querySelector("button#create-event").addEventListener('click', submit_event);
}
