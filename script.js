// API key and NEW API URL for 5-day forecast
const apiKey = '6dae7ceec328fb9c1cb6b642d6543df1';
const apiUrl = 'https://api.openweathermap.org/data/2.5/forecast';

const cityInput = document.getElementById('cityInput');
const fetchButton = document.getElementById('fetchButton');
const resultDiv = document.getElementById('result');
const forecastContainer = document.getElementById('forecast-container');
const unitsToggle = document.createElement('button'); // New button element

let currentWeatherData = null; // Store fetched data globally
let currentUnit = 'C'; // State variable: 'C' for Celsius, 'F' for Fahrenheit

// Helper function to convert wind degrees to a compass direction
function degToCompass(num) {
    const val = Math.floor((num / 22.5) + 0.5);
    const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[val % 16];
}

// Helper function for unit conversion
function convertTemp(tempC, unit) {
    if (unit === 'F') {
        return ((tempC * 9 / 5) + 32).toFixed(1);
    }
    return tempC.toFixed(1);
}

// Helper function to update the toggle button text
function updateToggleButton() {
    unitsToggle.textContent = `Show in °${currentUnit === 'C' ? 'F' : 'C'}`;
}

// --- INITIAL SETUP AND LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    // Append the units toggle button next to the fetch button
    unitsToggle.id = 'unitsToggle';
    unitsToggle.className = 'toggle-button';
    updateToggleButton();
    fetchButton.insertAdjacentElement('afterend', unitsToggle);

    // Initial load logic
    resultDiv.innerHTML = '<p>Attempting to determine your location...</p>';
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                fetchWeatherDataByCoords(position.coords.latitude, position.coords.longitude);
            },
            error => {
                resultDiv.innerHTML = '<p>Enter a city name above or click "Get Weather" to fetch data.</p>';
            }
        );
    } else {
        resultDiv.innerHTML = '<p>Geolocation not supported. Please enter a city name.</p>';
    }
});
// ----------------------------------------------------

// --- EVENT LISTENERS ---
fetchButton.addEventListener('click', () => {
    const city = cityInput.value;
    if (city) {
        fetchWeatherDataByCity(city);
    } else {
        resultDiv.innerHTML = `<p style="color: red;">Please enter a city name.</p>`;
        forecastContainer.innerHTML = '';
        document.body.className = 'weather-default';
        currentWeatherData = null;
    }
});

unitsToggle.addEventListener('click', () => {
    // Toggle the unit state
    currentUnit = currentUnit === 'C' ? 'F' : 'C';
    updateToggleButton();
    
    // Re-render the UI with the new unit if data exists
    if (currentWeatherData) {
        displayCurrentWeather(currentWeatherData, currentWeatherData.list[0]);
        displayForecast(currentWeatherData.list);
    }
});
// ----------------------------------------------------

// --- FETCHING & PROCESSING ---
function setLoadingState() {
    resultDiv.innerHTML = `<div class="loading-spinner"></div><p>Fetching weather data...</p>`;
    forecastContainer.innerHTML = '';
    document.body.className = 'weather-default';
    currentWeatherData = null; // Clear old data
}

async function fetchWeatherDataByCity(city) {
    setLoadingState();
    try {
        const response = await fetch(`${apiUrl}?q=${city}&appid=${apiKey}&units=metric`);
        if (!response.ok) {
            throw new Error('City not found');
        }
        const data = await response.json();
        currentWeatherData = data; // Store data
        processWeatherData(data);
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
        forecastContainer.innerHTML = '';
    }
}

async function fetchWeatherDataByCoords(lat, lon) {
    setLoadingState();
    try {
        const response = await fetch(`${apiUrl}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
        if (!response.ok) {
            throw new Error('Unable to fetch weather for your location.');
        }
        const data = await response.json();
        currentWeatherData = data; // Store data
        processWeatherData(data);
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
        forecastContainer.innerHTML = '';
    }
}

function processWeatherData(fullData) {
    const currentData = fullData.list[0];
    const cityName = fullData.city.name;
    const condition = currentData.weather[0].description;
    const temp = convertTemp(currentData.main.temp, currentUnit); // Use 'C' by default for announcement
    
    displayCurrentWeather(fullData, currentData);
    displayForecast(fullData.list);
    updateBackgroundColor(currentData.weather[0].main);
    announceWeather(cityName, temp, condition);
}
// ----------------------------------------------------

// --- DISPLAY FUNCTIONS ---
function displayCurrentWeather(fullData, currentData) {
    
    // Core Metrics
    const cityName = fullData.city.name;
    const tempC = currentData.main.temp;
    const tempFeelsC = currentData.main.feels_like;
    const humidity = currentData.main.humidity;
    
    // Converted Metrics
    const tempDisplay = convertTemp(tempC, currentUnit);
    const tempFeelsDisplay = convertTemp(tempFeelsC, currentUnit);
    const unitSymbol = `°${currentUnit}`;
    
    // Advanced Metrics
    const windSpeed = currentData.wind.speed.toFixed(1); // m/s
    const windDirection = degToCompass(currentData.wind.deg);
    const pressure = currentData.main.pressure; // hPa
    
    // Sunrise and Sunset
    const sunriseUnix = fullData.city.sunrise;
    const sunsetUnix = fullData.city.sunset;
    const sunriseTime = new Date(sunriseUnix * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const sunsetTime = new Date(sunsetUnix * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    
    resultDiv.innerHTML = `
        <div class="current-weather-content">
            <table class="temp-table">
                <thead>
                    <tr>    
                        <th>City</th>
                        <th>Temp (${unitSymbol})</th>
                        <th>Feels Like (${unitSymbol})</th> 
                        <th>Humidity (%)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${cityName}</td>
                        <td>${tempDisplay}</td>
                        <td>${tempFeelsDisplay}</td>
                        <td>${humidity}</td>
                    </tr>
                </tbody>
            </table>

            <div class="metrics-grid">
                <div class="metric-card">
                    <h4>Wind</h4>
                    <p>${windSpeed} m/s (${windDirection})</p>
                </div>
                <div class="metric-card">
                    <h4>Pressure</h4>
                    <p>${pressure} hPa</p>
                </div>
                <div class="metric-card">
                    <h4>Sunrise</h4>
                    <p>${sunriseTime}</p>
                </div>
                <div class="metric-card">
                    <h4>Sunset</h4>
                    <p>${sunsetTime}</p>
                </div>
            </div>
        </div>
    `;
}

function displayForecast(forecastList) {
    forecastContainer.innerHTML = '<h2>5-Day Forecast</h2><div class="forecast-cards-wrapper"></div>';
    const wrapper = document.querySelector('.forecast-cards-wrapper');

    const dailyForecasts = forecastList.filter(item => item.dt_txt.includes("12:00:00"));

    dailyForecasts.forEach((day, index) => {
        const dayName = (index === 0) ? 'Today' : new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
        const iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`;
        
        // Convert temperature for the forecast cards
        const tempC = day.main.temp;
        const tempDisplay = convertTemp(tempC, currentUnit);
        const unitSymbol = `°${currentUnit}`;

        const condition = day.weather[0].main;

        const cardHTML = `
            <div class="forecast-card">
                <h4>${dayName}</h4>
                <img src="${iconUrl}" alt="${condition}">
                <p class="temp">${tempDisplay}${unitSymbol}</p>
                <p class="condition">${condition}</p>
            </div>
        `;
        wrapper.innerHTML += cardHTML;
    });
}

function announceWeather(city, temp, condition) {
    if ('speechSynthesis' in window) {
        // Announce the temperature in the default Celsius, or state the unit clearly
        const unit = currentUnit === 'C' ? 'Celsius' : 'Fahrenheit';
        const message = `The current weather in ${city} is ${condition} with a temperature of ${temp} degrees ${unit}.`;
        const speech = new SpeechSynthesisUtterance(message);
        speech.rate = 1.0;
        speech.pitch = 1.0;
        window.speechSynthesis.speak(speech);
    }
}

function updateBackgroundColor(condition) {
    document.body.className = '';
    switch (condition) {
        case 'Clear':
        case 'Sunny':
            document.body.classList.add('weather-sunny');
            break;
        case 'Clouds':
        case 'Mist':
        case 'Haze':
        case 'Smoke':
        case 'Fog':
            document.body.classList.add('weather-cloudy');
            break;
        case 'Rain':
        case 'Drizzle':
        case 'Thunderstorm':
        case 'Snow':
            document.body.classList.add('weather-rainy');
            break;
        default:
            document.body.classList.add('weather-default');
    }
}
