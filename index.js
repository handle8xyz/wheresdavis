
const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// `data` is a JavaScript object that contains the data from the JSON file loaded in index.html
const picker = document.getElementById('date-picker');
const currentDate = new Date();

function inputDate(date) {
    return date.toISOString().split('T')[0]
}

picker.min = inputDate(new Date("10 September 2024"));
picker.max = inputDate(new Date("10 November 2024"));
picker.value = inputDate(currentDate);

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

async function updateDisplay(date) {
    if (!data) {
        return
    }

    let currentLocName = null;
    for (const row of data["dates"]) {
        const start = new Date(row["start"]);
        const end = new Date(row["end"]);
        if (date >= start && date <= end) {

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
        return displayError(date);
    }
}

updateDisplay(new Date());

picker.addEventListener('input', () => {
    const currentDate = new Date(picker.value);
    updateDisplay(currentDate);
});