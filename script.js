document.addEventListener("DOMContentLoaded", function () {
    const apiKey = "8c4d1e7594b4cd1ad645f26a2da4d1b1"; // Замените на ваш API ключ OpenWeather
    const searchBtn = document.getElementById("search-btn");
    const cityInput = document.getElementById("city-input");

    // Инициализация карты
    const map = L.map('map').setView([51.505, -0.09], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const precipitationLayer = L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=' + apiKey, {
        attribution: '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
    }).addTo(map);

    let marker;

    // Получение данных погоды для Берлина при загрузке страницы
    getWeatherData("Berlin");

    searchBtn.addEventListener("click", function () {
        const city = cityInput.value;
        getWeatherData(city);
    });

    function getWeatherData(city) {
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                console.log('Weather data:', data); // Отладочный лог
                updateWeatherCard(data);
                updateTime(data);
                updateMap(data.coord.lat, data.coord.lon); // Обновление карты с новыми координатами
            })
            .catch(error => console.error("Error fetching the weather data:", error));

        fetch(forecastUrl)
            .then(response => response.json())
            .then(data => {
                console.log('Forecast data:', data); // Отладочный лог
                updateForecast(data);
            })
            .catch(error => console.error("Error fetching the forecast data:", error));
    }

    function updateWeatherCard(data) {
        const cityCountry = document.getElementById("city-country");
        const temperature = document.getElementById("temperature");
        const weatherDescription = document.getElementById("weather-description");
        const windSpeed = document.getElementById("wind-speed");
        const humidity = document.getElementById("humidity");
        const pressure = document.getElementById("pressure");

        if (cityCountry && temperature && weatherDescription && windSpeed && humidity && pressure) {
            cityCountry.textContent = `${data.name}, ${data.sys.country}`;
            temperature.innerHTML = `${Math.round(data.main.temp)}<span style="color: #E7F4FA;">°C</span>`;

            const description = data.weather[0].description;
            const capitalizedDescription = description.charAt(0).toUpperCase() + description.slice(1);

            weatherDescription.innerHTML = `${capitalizedDescription}<br>
                <span style="color: #D1C9D2;">Feels like </span>
                <span style="color: #E7F4FA;">${data.main.feels_like}°C</span>`;

            windSpeed.innerHTML = `${data.wind.speed} m/s ${data.wind.deg}`;
            humidity.innerHTML = `${data.main.humidity}%`;
            pressure.innerHTML = `${data.main.pressure} mm Hg`;
        } else {
            console.error("One or more elements are missing in the DOM");
        }
    }

    function updateForecast(data) {
        const forecastContainer = document.getElementById("forecast-container");
        forecastContainer.innerHTML = ""; // Очищаем предыдущие данные
    
        data.list.slice(0, 9).forEach(hour => { // берем 9 часов для прогноза
            const forecastElement = document.createElement("div");
            forecastElement.classList.add("one-hour");
    
            const time = new Date(hour.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const temp = `${hour.main.temp}°C`;
            const icon = `http://openweathermap.org/img/wn/${hour.weather[0].icon}.png`;
    
            forecastElement.innerHTML = `
                <p style="color: #D1C9D2;">${time}</p>
                <img src="${icon}" alt="Weather Image">
                <p style="color: #E7F4FA;">${temp}</p>
            `;
    
            forecastContainer.appendChild(forecastElement);
        });
    }

    function updateTime(data) {
        const timeNow = document.getElementById("time-now");
        const timezoneOffset = data.timezone;
        const localTime = new Date(new Date().getTime() + timezoneOffset * 1000);
        const hours = localTime.getUTCHours().toString().padStart(2, '0');
        const minutes = localTime.getUTCMinutes().toString().padStart(2, '0');

        timeNow.textContent = `Now ${hours}:${minutes}`;
    }

    function updateMap(lat, lon) {
        if (marker) {
            map.removeLayer(marker);
        }
        map.setView([lat, lon], 10);
        marker = L.marker([lat, lon]).addTo(map);
    }
});
