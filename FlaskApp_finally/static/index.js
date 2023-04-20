// This function creates daily buttons for each day of the week
function createDailyButtons() {
    $("#daily-buttons").html(""); // Clear existing daily buttons
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(day => {
        $("#daily-buttons").append(`<button class="daily-button" data-day="${day}">${day}</button>`);
    });
}

// This function populates the station selector dropdown for predictions
function populateStationSelectorForPrediction(selector) {
    $.getJSON("/stations", function (stations) {
        $.each(stations, function (key, station) {
            $(selector).append(`<option value="${station.number}">${station.name}</option>`);
        });
    });
}

// This function clears the content depending on which button was clicked: 'current' or 'prediction'
function clearContent(buttonClicked) {
    if (buttonClicked === 'current') {
        $("#form-container").addClass("hidden");
        $("#prediction-result").html("");
        $("#daily-buttons").show();
        $("#weekly-chart").show();
        $("#hourly-chart").show();
        $("#select-title").show();
    } else if (buttonClicked === 'prediction') {
        $("#select-title").hide();
        $("#station-selector").hide();
        $("#confirm-button").hide();
        $("#daily-buttons").hide();
        $("#weekly-chart").hide();
        $("#hourly-chart").hide();
    }
}

// This block sets up the initial state of the application when the page is loaded
$(document).ready(function () {
    // Get stations and populate the select element
    $.getJSON("/stations", function (stations) {
        $.each(stations, function (key, station) {
            $("#station-selector").append(`<option value="${station.number}">${station.name}</option>`);
        });
    });
    $("#station-selector").hide();
    $("#confirm-button").hide();
    $("#input-form").hide();

    $("#current").on("click", function () {
        $("#station-selector").show();
        $("#confirm-button").show();
        clearContent('current');
    });

    $("#prediction").on("click", function () {
        const formContainer = $("#form-container");
        if (!formContainer.html()) {
            // Construct the form
            const form = `
                                <form id="prediction-form">
                                    <label for="station">Station:</label>
                                        <select id="station" name="station" required></select>
                                <br>
                                    <label for="month">Month:</label>
                                    <select id="month" name="month" required>
                                            <option value="1">January</option>
                                            <option value="2">February</option>
                                            <option value="3">March</option>
                                            <option value="4">April</option>
                                            <option value="5">May</option>
                                            <option value="6">June</option>
                                            <option value="7">July</option>
                                            <option value="8">August</option>
                                            <option value="9">September</option>
                                            <option value="10">October</option>
                                            <option value="11">November</option>
                                            <option value="12">December</option>
                                        </select>
                                <br>
                                    <label for="day">Day:</label>
                                    <input type="number" id="day" name="day" min="1" max="31" required>
                                <br>
                                    <label for="hour">Hour:</label>
                                    <input type="number" id="hour" name="hour" min="0" max="23" required>
                                <br>
                                    <input type="submit" value="Get Prediction">
                                </form>
                                    <div id="prediction-result"></div>
                                `;
            formContainer.html(form);
            populateStationSelectorForPrediction('#station');

            document.getElementById('prediction-form').addEventListener('submit', async (event) => {
                event.preventDefault();
                const month = document.getElementById('month').value;
                const day = document.getElementById('day').value;
                const hour = document.getElementById('hour').value;
                const station = document.getElementById('station').value;

                try {
                    const response = await fetch(`/prediction?month=${month}&day=${day}&hour=${hour}&station=${station}`);
                    if (response.ok) {
                        const data = await response.json(); // Parse the response as JSON
                        const prediction = Math.round(data.prediction[0]); // Round the prediction value to the nearest integer
                        document.getElementById('prediction-result').innerHTML = `<h2>Prediction Result:</h2><p>The predicted available bikes are ${prediction}.</p>`;
                    } else {
                        document.getElementById('prediction-result').innerHTML = `<p>Error: ${response.statusText}</p>`;
                    }
                } catch (error) {
                    document.getElementById('prediction-result').innerHTML = `<p>Error: ${error.message}</p>`;
                }
            });

        }
        clearContent('prediction');
        formContainer.removeClass("hidden");
    });
});

// This event handler fetches weekly and hourly data for the selected station when the "Confirm" button is clicked
$("#confirm-button").on("click", function () {
    const stationNumber = $("#station-selector").val();
    if (stationNumber) {

        $.getJSON(`/weekly_data?number=${stationNumber}`, function (weeklyData) {
            createWeeklyChart(weeklyData, stationNumber);
        });


        createDailyButtons();

        $(".daily-button").off("click").on("click", function () {
            const day = $(this).attr("data-day");
            getHourlyInfo(day, stationNumber);
        });

        getHourlyInfo('Monday', stationNumber);

    } else {
        alert("Please select a station.");
    }
});

let weeklyChart;
let hourlyChart;

// This function creates a weekly bar chart displaying the average number of bikes available for each day of the week
function createWeeklyChart(weeklyData, stationNumber) {
    const ctx = document.getElementById('weekly-chart').getContext('2d');
    if (weeklyChart) {
        weeklyChart.destroy();
    }
    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weeklyData.map(row => row.day),
            datasets: [{
                label: `Station ${stationNumber}: Average Bikes in the Most Recent Week`,
                data: weeklyData.map(row => row.avg_bikes),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// This function creates an hourly bar chart displaying the average number of bikes available for a specific day
function createHourlyChart(hourlyData, day) {
    const ctx = document.getElementById('hourly-chart').getContext('2d');
    if (hourlyChart) {
        hourlyChart.destroy();
    }
    hourlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hourlyData.map(row => row.hour),
            datasets: [{
                label: `${day}: Average Number of Available Bikes`,
                data: hourlyData.map(row => row.avg_bikes),
                backgroundColor: 'rgba(238, 108, 48, 0.6)',
                borderColor: 'rgba(238, 108, 48, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// This function fetches hourly data for a specific day and station number, and then creates an hourly chart
function getHourlyInfo(day, stationNumber) {
    $.getJSON(`/hourly_data?number=${stationNumber}&day=${day}`, function (hourlyData) {
        createHourlyChart(hourlyData, day);
    });
}

let markers = [];
let startPlaceResult;
let endPlaceResult;

// This function initializes the map and sets up markers, event listeners, and other map-related features.
function initMap() {
    fetch("/stations")
        .then((response) => response.json())
        .then((data) => {
            const dublin = {lat: 53.347140, lng: -6.266155};
            map = new google.maps.Map(document.getElementById("map"), {
                zoom: 14,
                center: dublin,
            });

            const infowindow = new google.maps.InfoWindow();
            console.log(data);

            for (const station of data) {
                const defaultIcon = {
                    url: "/static/bikes.png",
                };

                var marker = new google.maps.Marker({
                    position: {
                        lat: station.position_lat,
                        lng: station.position_lng,
                    },
                    map: map,
                    title: station.name,
                    number: station.number,
                    icon: defaultIcon,
                });
                markers.push(marker);

                marker.addListener("click", () => {
                    const bikes = station.available_bikes;
                    const stands = station.available_bike_stations;
                    const histogramSvg = `
            <svg width="200" height="100">
                <rect x="10" y="10" width="${bikes * 2}" height="30" fill="rgba(75, 192, 192, 1)"></rect>
                <rect x="10" y="50" width="${stands * 2}" height="30" fill="rgba(238, 108, 48, 1)"></rect>
            </svg>
          `;
                    infowindow.setContent(
                        `<h><b>Station ${station.number}: ${station.name}</b></h><br><br>` +
                        `<p style="color: rgba(75, 192, 192, 1);"><b>Available Bikes: </b>${station.available_bikes}</p><br>` +
                        `<p style="color: rgba(238, 108, 48, 1);"><b>Available Bike Stands: </b>${station.available_bike_stations}</p><br>` +
                        histogramSvg
                    );

                    infowindow.open(map);
                    infowindow.setPosition({
                        lat: station.position_lat,
                        lng: station.position_lng,
                    });
                });
            }

            fetchWeatherData(53.350140, -6.266155);
            let heatmap = null;

            $("#heatmap-checkbox").on("change", function () {
                if ($(this).prop("checked")) {
                    if (!heatmap) {
                        const heatmapData = data.map((station) => ({
                            location: new google.maps.LatLng(
                                station.position_lat,
                                station.position_lng
                            ),
                            weight: station.available_bikes,
                        }));

                        heatmap = new google.maps.visualization.HeatmapLayer({
                            data: heatmapData,
                            map: map,
                            radius: 40,
                        });
                    } else {
                        heatmap.setMap(map);
                    }
                } else {
                    if (heatmap) {
                        heatmap.setMap(null);
                    }
                }
            });

            const dublinBounds = new google.maps.LatLngBounds(
                new google.maps.LatLng(53.298810, -6.387050),
                new google.maps.LatLng(53.410580, -6.114490)
            );

            const options = {
                bounds: dublinBounds,
                componentRestrictions: {country: "ie"},
                fields: ["geometry", "name"],
            };

            const startAutocomplete = new google.maps.places.Autocomplete(
                document.getElementById("start-location"),
                options
            );
            const endAutocomplete = new google.maps.places.Autocomplete(
                document.getElementById("end-location"),
                options
            );

            startAutocomplete.addListener("place_changed", () => {
                startPlaceResult = startAutocomplete.getPlace();
            });

            endAutocomplete.addListener("place_changed", () => {
                endPlaceResult = endAutocomplete.getPlace();
            });

            // Add click listener to the button
            document.getElementById("find").addEventListener("click", () => {
                const startPlace = startPlaceResult;
                const endPlace = endPlaceResult;

                if (!startPlace || !startPlace.geometry || !endPlace || !endPlace.geometry) {
                    alert("Please choose valid start and end locations.");
                    return;
                }

                const startCoords = {
                    lat: startPlace.geometry.location.lat(),
                    lng: startPlace.geometry.location.lng(),
                };

                const endCoords = {
                    lat: endPlace.geometry.location.lat(),
                    lng: endPlace.geometry.location.lng(),
                };

                // Find and display the nearest stations to the start and end points
                findNearestStation(startCoords, endCoords, data);
                storeInputHistory(startPlace.name, endPlace.name);
            });

            document.getElementById("clear").addEventListener("click", () => {
                clearInputs();
                displayInputHistory();
            });

            // Click listeners for showing input history on click
            document.getElementById("start-location").addEventListener("click", displayInputHistory);
            document.getElementById("end-location").addEventListener("click", displayInputHistory);
        });
}

// This function is called when the page loads and sets up the Google Maps API script.
window.onload = function () {
  const script = document.createElement("script");
  script.src =
    "https://maps.googleapis.com/maps/api/js?key=AIzaSyC52j5KuFhqFUz3qfPc7s16bmfqRLb9wy8&libraries=places,geometry,visualization&v=weekly&callback=initMap";
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
};

// This function displays the input history in the dropdown menus.
function displayInputHistory() {
    const inputHistory = getCookie("inputHistory");
    if (inputHistory) {
        const history = JSON.parse(inputHistory);

        const startHistory = document.getElementById("start-history");
        startHistory.innerHTML = "";
        const startOption = document.createElement("option");
        startOption.value = history.startLocation;
        startOption.text = history.startLocation;
        startHistory.appendChild(startOption);

        const endHistory = document.getElementById("end-history");
        endHistory.innerHTML = "";
        const endOption = document.createElement("option");
        endOption.value = history.endLocation;
        endOption.text = history.endLocation;
        endHistory.appendChild(endOption);
    }
}

// This function stores the input history in a cookie.
function storeInputHistory(startLocation, endLocation) {
    const inputHistory = JSON.stringify({startLocation, endLocation});
    setCookie("inputHistory", inputHistory, 30); // Store input history for 30 days
}

// This function sets a cookie with the specified name, value, and expiration days.
function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    const expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

// This function retrieves the value of a cookie with the specified name.
function getCookie(cname) {
    const name = cname + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === " ") {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

let prevStartMarker, prevEndMarker;

// This function resets the previous start and end station markers to their default icons.
function resetPreviousMarkers() {
    // Define the default icon
    const defaultIcon = {
        url: "/static/bikes.png",
    };

    // Reset the icons of the previously marked start and end stations
    if (prevStartMarker) {
        prevStartMarker.set('icon', defaultIcon);
    }
    if (prevEndMarker) {
        prevEndMarker.set('icon', defaultIcon);
    }
}

// This function clears the input fields for the start and end locations.
function clearInputs() {
    document.getElementById("start-location").value = "";
    document.getElementById("end-location").value = "";
}

// This function finds and displays the nearest stations to the start and end points.
function findNearestStation(startCoords, endCoords, stations) {
    const maxDistance = 1; // Maximum distance in kilometers
    let startNearest, endNearest;
    let minStartDist = Infinity;
    let minEndDist = Infinity;

    for (const station of stations) {
        const stationCoords = {lat: station.position_lat, lng: station.position_lng};
        const startDist = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(startCoords),
            new google.maps.LatLng(stationCoords)
        ) / 1000;
        const endDist = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(endCoords),
            new google.maps.LatLng(stationCoords)
        ) / 1000;

        if (startDist <= maxDistance && startDist < minStartDist) {
            minStartDist = startDist;
            startNearest = station;
        }
        if (endDist <= maxDistance && endDist < minEndDist) {
            minEndDist = endDist;
            endNearest = station;
        }
    }

    if (!startNearest && !endNearest) {
        alert("There is no bike station nearby.");
        return;
    }

    // Check if the nearest stations are found
    if (!startNearest) {
        alert("There is no bike station near start place.");
        return;
    }
    if (!endNearest) {
        alert("There is no bike station near end place.");
        return;
    }

    if (!startNearest || !endNearest) {
        return;
    }

    resetPreviousMarkers();

    alert(`Nearest start station: ${startNearest.name}.\nNearest end station: ${endNearest.name}.\nConfirm to see them marked on the map.`);

    // Define the start and end icons
    const startIcon = {
        url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
    };
    const endIcon = {
        url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
    };

    for (const marker of markers) {
        // If the marker matches the nearest start station, change its icon
        if (marker.number === startNearest.number) {
            marker.set('icon', startIcon);
            prevStartMarker = marker; // Store the marker as the previous start marker
        }
        // If the marker matches the nearest end station, change its icon
        if (marker.number === endNearest.number) {
            marker.set('icon', endIcon);
            prevEndMarker = marker; // Store the marker as the previous end marker
        }
    }
}

// Initialize the map variable
var map;
window.initMap = initMap;

// Access the dark mode checkbox element
const darkModeCheckbox = document.getElementById('dark_mode');

// Define the dark mode styles for the map
const darkStyles = [
    {elementType: "geometry", stylers: [{color: "#000000"}]},
    {elementType: "labels.text.stroke", stylers: [{color: "#000000"}]},
    {elementType: "labels.text.fill", stylers: [{color: "#ffffff"}]},
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{color: "#d59563"}],
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{color: "#ffffff"}],
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{color: "#336600"}],
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{color: "#ffffff"}],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{color: "#666666"}],
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{color: "#ffffff"}],
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{color: "#ffffff"}],
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{color: "#999999"}],
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{color: "#ffffff"}],
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{color: "#ffffff"}],
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{color: "#000000"}],
    },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{color: "#d59563"}],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{color: "#000033"}],
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{color: "#ffffff"}],
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{color: "#000033"}],
    },
]

// This function toggles the dark mode on the map based on the state of the dark mode checkbox.
function toggleDarkMode() {
    const darkModeCheckbox = document.getElementById('dark_mode');
    const mapStyles = darkModeCheckbox.checked ? darkStyles : null;
    map.set('styles', mapStyles);
}


// Add an event listener to the checkbox element
darkModeCheckbox.addEventListener('change', toggleDarkMode);

// This function fetches the weather data for the specified latitude and longitude.
function fetchWeatherData(lat, lon) {
    const apiKey = '582d617b5f64062c2ac443c5a5ca2f3f'; // Replace with your OpenWeatherMap API key
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => displayWeatherData(data));
}

// This function displays the fetched weather data on the page.
function displayWeatherData(data) {
    const description = data.weather[0].description;
    const Cdescription = description.charAt(0).toUpperCase() + description.slice(1).toLowerCase();
    const temperature = data.main.temp;

    document.getElementById('weather-description').innerText = `${Cdescription}`;
    document.getElementById('weather-temperature').innerText = `Temperature: ${temperature} °C`;
}

// Set an interval to fetch weather data every 15 minutes
setInterval(() => fetchWeatherData(53.350140, -6.266155), 15 * 60 * 1000);