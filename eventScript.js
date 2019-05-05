const BASE_URL = 'https://hackathon-239523.appspot.com'

function getEventId() {
    const urlParams = new URLSearchParams(window.location.search)
    const eventID = urlParams.get('event')
    return eventID
}

function getEventDetails(id) {
    fetch(BASE_URL + '/events/' + id)
        .then(function (response) {
            return response.json()
        })
        .then(function (result) {
            document.getElementById('eventName').innerText =
                result[0].event_name
            document.getElementById('eventDate').innerText =
                result[0].start_time
            document.getElementById('eventDetails').innerText =
                result[0].event_description
            drawMap(parseFloat(result[0].lat), parseFloat(result[0].long))
        })
}

function getEventAttendees(id) {
    fetch(BASE_URL + '/events/' + id + '/people')
        .then(function (response) {
            return response.json()
        })
        .then(function (result) {
            let container = document.querySelector("div#attendees");
            result.forEach(i => {
                let el = document.createElement('div');
                if (!i.minutes_to_dest) {
                    el.innerText = i.person_name + ': Not yet left.';
                } else {
                    el.innerText = i.person_name + ': ' + i.minutes_to_dest+ ' minutes away.';
                }
                container.append(el);
                container.append(document.createElement('hr'));
            })

            console.log(result)
        })
}

function geocodeLocation() {
    geocoder = new google.maps.Geocoder()
    var address = document.getElementById('address').value
    geocoder.geocode({ address: address }, function (results, status) {
        if (status == 'OK') {
            console.log(results[0].geometry.location)
        }
    })
}

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
                travelMode: 'WALKING'
            },
            callback
        )
    }

    async function callback(response, status) {
        if (status == 'OK') {
            var results = response.rows[0].elements[0]
            var duration = results.duration.value;

            try {
                let response = await fetch(`${BASE_URL}/events/${getEventId()}/people/${localStorage.getItem('person_id')}/time_to?minutes_to_dest=${Math.round(duration / 60)}`, { method: 'post' })
                console.debug('Time-to submitted');
            } catch (err) {
                console.error(err);
            }
        }
    }
}

async function check_user() {
    if (!localStorage.getItem('person_id')) {
        let person_name = prompt(
            "Hi there - It doesn't look like we've seen you before. Enter your name to continue:"
        )
        let response = await fetch(
            `${BASE_URL}/people/?person_id=${person_name}`,
            { method: 'post' }
        )
        let z = await response.json()
        localStorage.setItem('person_id', z[0].person_id)
    }
}

async function get_people_in_event(eventid) {
    let response = await fetch(`${BASE_URL}/events/${eventid}/people`)
    let z = await response.json();
    return z
}
async function is_user_in_event(eventid) {

    const response = await get_people_in_event(eventid);
    const response_filtered = Array.from(response).filter((i) => { return i.person_id == localStorage.getItem('person_id') })

    return !(response_filtered.length === 0);
}

async function submit_time_to() {
    let response = await fetch(`${BASE_URL}/events/${getEventId()}`);
    let e = await response.json();

    getDuration(e[0].lat, e[0].long);
}

window.onload = async () => {
    check_user();

    let b = document.querySelector("#attend-but");
    const event = getEventId()
    if (await is_user_in_event(event)) {
        b.innerText = "Attending";
        b.disabled = true;
        submit_time_to();
        setInterval(submit_time_to, 30000);

    } else {
        b.innerText = "Attend this event!";
        b.disabled = false;
        b.addEventListener('click', async () => {
            try {
                let response = await fetch(`${BASE_URL}/events/${event}/people?person_id=${localStorage.getItem('person_id')}`, { method: 'post' })
                alert("You are now attending this event");
            } catch (err) {
                console.error(err);
                alert("Unknown error");
            }
            //let z = await response.json();
        })
    }
    document.getElementById('attendees').append(document.createElement('hr'))
    getEventDetails(event)
    getEventAttendees(event)
}
