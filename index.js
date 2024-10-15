
const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// `data` is a JavaScript object that contains the data from the JSON file loaded in index.html
const slider = document.getElementById('date-slider');
const date_element = document.getElementById('current-date');

slider.min = new Date("10 September 2024").getTime();
slider.max = new Date("10 November 2024").getTime();

function displayError(info) {
    console.error('No location data found for:', info);
    document.getElementById('location').textContent = 'No location data found';
    // Clear the map
    map.setView([0, 0], 2);
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
    return;
}

async function updateDisplay(currentDate) {
    if (!data) {
        return
    }
    date_element.textContent = currentDate.toDateString();

    let currentLocName = null;
    for (const row of data["dates"]) {
        const start = new Date(row["start"]);
        const end = new Date(row["end"]);
        if (currentDate >= start && currentDate <= end) {

            currentLocName = row["name"];
            break;
        }
    }

    if (currentLocName) {
        const currentLocId = data["places"][currentLocName];
        const locationData = data["metadata"][currentLocId];
        if (!locationData) {
            return displayError(currentLocId);
        }

        try {
            const { lat, lon } = locationData;
            map.setView([lat, lon], 10);
            L.marker([lat, lon]).addTo(map)
                .bindPopup(currentLocName)
                .openPopup();
            document.getElementById('location').textContent = currentLocName;
        } catch (error) {
            console.error('Error displaying location:', error);
            document.getElementById('location').textContent = 'Error displaying location';
        }

    } else {
        return displayError(currentDate);
    }
}

updateDisplay(new Date());

// Add a slider to control the date, creating the element in JavaScript
const currentDate = new Date();
// Dates range from the one month before the current date to one month after
slider.min = currentDate.getTime() - 1000 * 60 * 60 * 24 * 30;
slider.max = currentDate.getTime() + 1000 * 60 * 60 * 24 * 30;
slider.step = 1000 * 60 * 60 * 24; // 1 day in milliseconds
slider.value = currentDate.getTime();

slider.addEventListener('input', () => {
    const currentDate = new Date(parseInt(slider.value));
    updateDisplay(currentDate);
});