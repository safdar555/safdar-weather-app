// API key and NEW API URL for 5-day forecast
const apiKey = '6dae7ceec328fb9c1cb6b642d6543df1';
const apiUrl = 'https://api.openweathermap.org/data/2.5/forecast';

const cityInput = document.getElementById('cityInput');
const fetchButton = document.getElementById('fetchButton');
const resultDiv = document.getElementById('result');
const forecastContainer = document.getElementById('forecast-container');

fetchButton.addEventListener('click', () => {
    const city = cityInput.value;
    if (city) {
        fetchWeatherData(city);
    } else {
        resultDiv.innerHTML = `<p style="color: red;">Please enter a city name.</p>`;
        forecastContainer.innerHTML = '';
        document.body.className = 'weather-default';
    }
});

async function fetchWeatherData(city) {
    try {
        const response = await fetch(`${apiUrl}?q=${city}&appid=${apiKey}&units=metric`);
        if (!response.ok) {
            throw new Error('City not found');
        }
        const data = await response.json();
        
        const currentData = data.list[0];
        const cityName = data.city.name;
        const condition = currentData.weather[0].description;
        const temp = currentData.main.temp.toFixed(1);
        
        displayCurrentWeather(currentData, cityName);
        displayForecast(data.list);
        updateBackgroundColor(currentData.weather[0].main);
        
        // 🎙️ NEW FEATURE: Announce the weather
        announceWeather(cityName, temp, condition);

    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
        forecastContainer.innerHTML = '';
        document.body.className = 'weather-default';
    }
}

function announceWeather(city, temp, condition) {
    // Check if the browser supports the Web Speech API
    if ('speechSynthesis' in window) {
        const message = `The current weather in ${city} is ${condition} with a temperature of ${temp} degrees Celsius.`;
        const speech = new SpeechSynthesisUtterance(message);
        
        // Optional: Set voice properties (e.g., speed, pitch)
        speech.rate = 1.0; // Speed of speech
        speech.pitch = 1.0; // Pitch of speech

        window.speechSynthesis.speak(speech);
    } else {
        console.warn("Your browser does not support the Web Speech API for voice announcement.");
    }
}


function displayCurrentWeather(currentData, cityName) {
    const celsius = currentData.main.temp;
    const fahrenheit = (celsius * 9/5) + 32;
    const humidity = currentData.main.humidity;
    
    resultDiv.innerHTML = `
        <table>
            <thead>
                <tr>    
                    <th>City</th>
                    <th>Temperature (°C)</th>
                    <th>Temperature (°F)</th>  
                    <th>Humidity (%)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${cityName}</td>
                    <td>${celsius.toFixed(2)}</td>
                    <td>${fahrenheit.toFixed(2)}</td>
                    <td>${humidity}</td>
                </tr>
            </tbody>
        </table>
    `;
}

function displayForecast(forecastList) {
    forecastContainer.innerHTML = '<h2>5-Day Forecast</h2><div class="forecast-cards-wrapper"></div>';
    const wrapper = document.querySelector('.forecast-cards-wrapper');

    // Filter the list to get one forecast per day (at 12:00 PM)
    const dailyForecasts = forecastList.filter(item => item.dt_txt.includes("12:00:00"));

    dailyForecasts.forEach((day, index) => {
        const dayName = (index === 0) ? 'Today' : new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
        const iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`;
        const temp = day.main.temp.toFixed(1);
        const condition = day.weather[0].main;

        const cardHTML = `
            <div class="forecast-card">
                <h4>${dayName}</h4>
                <img src="${iconUrl}" alt="${condition}">
                <p class="temp">${temp}°C</p>
                <p class="condition">${condition}</p>
            </div>
        `;
        wrapper.innerHTML += cardHTML;
    });
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