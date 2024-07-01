document.addEventListener("DOMContentLoaded", function () {
    const apiKey = "8c4d1e7594b4cd1ad645f26a2da4d1b1";
    const searchBtn = document.getElementById("search-btn");
    const cityInput = document.getElementById("city-input");
    const unitToggleBtn = document.getElementById("unit-toggle-btn"); // Toggle button for unit conversion
    const nearBtn = document.getElementById("near-btn"); // Button for "Near with Me" feature
    let currentUnit = "metric"; // Current measurement unit (metric system)
    let currentWeatherData = null; // Variable to store current weather data
    let currentForecastData = null; // Variable to store current forecast data

    // Initializing the map
    const map = L.map('map').setView([51.505, -0.09], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const precipitationLayer = L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=' + apiKey, {
        attribution: '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
    }).addTo(map);

    let marker;
    let current_loc = "Berlin";
    
    // Gets the geolocation without delaying the loading of the page
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            current_loc =  getCityNameByCoords(lat, lon);
        }, error => {
            console.error("Error getting geolocation: ", error);
        });
    }

    // Sets the default location as the geolocation
    getWeatherData(current_loc);

    // Event listener for search button click
    searchBtn.addEventListener("click", function () {
        const city = cityInput.value;
        getWeatherData(city);
    });

    // Event listener for Enter key in the search input field
    cityInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            const city = cityInput.value;
            getWeatherData(city);
        }
    });
    
    // Event listener for unit toggle button
    unitToggleBtn.addEventListener("click", function () {
        currentUnit = currentUnit === "metric" ? "imperial" : "metric";
        if (currentWeatherData) {
            updateWeatherCard(currentWeatherData); // Update temperature display
        }
        if (currentForecastData) {
            updateForecast(currentForecastData.list); // Update hourly forecast
            renderWeather(currentForecastData.list); // Update weekly forecast
            renderMonthlyWeather(currentForecastData.list); // Update monthly forecast
            updateNextWeekWidget(currentForecastData.list); // Update next week widget
            updateTomorrowWidget(currentForecastData.list); // Update tomorrow widget
        }
    });

    // Event listener for "Near with Me" button
    nearBtn.addEventListener("click", function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getCityNameByCoords(lat, lon);
            }, error => {
                console.error("Error getting geolocation: ", error);
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    });

    // Function to get city name by coordinates
    async function getCityNameByCoords(lat, lon) {
        try {
            const reverseGeocodeUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
            const response = await fetch(reverseGeocodeUrl);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            const data = await response.json();
            const city = data[0].name;
            getWeatherData(city);
        } catch (error) {
            console.error("Error getting city name by coordinates: ", error);
        }
    }

    // Function to get weather data by city name
    async function getWeatherData(city) {
        try {
            const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

            const weatherResponse = await fetch(apiUrl);
            if (!weatherResponse.ok) {
                throw new Error(`HTTP error: ${weatherResponse.status}`);
            }
            const weatherData = await weatherResponse.json();
            console.log('Weather data:', weatherData); // Debug log
            currentWeatherData = weatherData; // Save current weather data
            updateWeatherCard(weatherData);
            updateTime(weatherData);
            updateMap(weatherData.coord.lat, weatherData.coord.lon); // Update map with new coordinates

            const forecastResponse = await fetch(forecastUrl);
            if (!forecastResponse.ok) {
                throw new Error(`HTTP error: ${forecastResponse.status}`);
            }
            const forecastData = await forecastResponse.json();
            console.log('Forecast data:', forecastData); // Debug log
            currentForecastData = forecastData; // Save current forecast data
            updateForecast(forecastData.list);
            renderWeather(forecastData.list);
            renderMonthlyWeather(forecastData.list); // Call function to render monthly forecast
            updateNextWeekWidget(forecastData.list); // Update next week widget
            updateTomorrowWidget(forecastData.list); // Update tomorrow widget
        } catch (error) {
            console.error("Error fetching the weather data:", error);
        }
    }

    // Function to update the weather card
    function updateWeatherCard(data) {
        const cityCountry = document.getElementById("city-country");
        const temperature = document.getElementById("temperature");
        const weatherDescription = document.getElementById("weather-description");
        const windSpeed = document.getElementById("wind-speed");
        const humidity = document.getElementById("humidity");
        const pressure = document.getElementById("pressure");

        if (cityCountry && temperature && weatherDescription && windSpeed && humidity && pressure) {
            cityCountry.textContent = `${data.name}, ${data.sys.country}`;
            const tempUnit = currentUnit === "metric" ? "°C" : "°F";
            const temp = currentUnit === "metric" ? Math.round(data.main.temp) : Math.round((data.main.temp * 9/5) + 32);
            const feelsLike = currentUnit === "metric" ? Math.round(data.main.feels_like) : Math.round((data.main.feels_like * 9/5) + 32);
            temperature.innerHTML = `${temp}<span style="color: #E7F4FA;">${tempUnit}</span>`;

            const description = data.weather[0].description;
            const capitalizedDescription = description.charAt(0).toUpperCase() + description.slice(1);

            weatherDescription.innerHTML = `${capitalizedDescription}<br>
                <span style="color: #D1C9D2;">Feels like </span>
                <span style="color: #E7F4FA;">${feelsLike}${tempUnit}</span>`;

            windSpeed.innerHTML = `${data.wind.speed} m/s ${data.wind.deg}`; // No changes
            humidity.innerHTML = `${data.main.humidity}%`; // No changes
            pressure.innerHTML = `${data.main.pressure} mm Hg`; // No changes
        } else {
            console.error("One or more elements are missing in the DOM");
        }
    }

    // Function to update the hourly forecast
    function updateForecast(data) {
        const forecastContainer = document.getElementById("forecast-container");
        forecastContainer.innerHTML = ""; // Clear previous data
    
        data.slice(0, 9).forEach(hour => { // Take 9 hours for the forecast
            const forecastElement = document.createElement("div");
            forecastElement.classList.add("one-hour");
    
            const time = new Date(hour.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const tempUnit = currentUnit === "metric" ? "°C" : "°F";
            const temp = currentUnit === "metric" ? Math.round(hour.main.temp) : Math.round((hour.main.temp * 9/5) + 32);
            const icon = `http://openweathermap.org/img/wn/${hour.weather[0].icon}.png`;
    
            forecastElement.innerHTML = `
                <p style="color: #D1C9D2;">${time}</p>
                <img src="${icon}" alt="Weather Image">
                <p style="color: #E7F4FA;">${temp}${tempUnit}</p>
            `;
    
            forecastContainer.appendChild(forecastElement);
        });
    }
    
    // Function to update the current time
    function updateTime(data) {
        const timeNow = document.getElementById("time-now");
        const timezoneOffset = data.timezone;
        const localTime = new Date(new Date().getTime() + timezoneOffset * 1000);
        const hours = localTime.getUTCHours().toString().padStart(2, '0');
        const minutes = localTime.getUTCMinutes().toString().padStart(2, '0');

        timeNow.textContent = `Now ${hours}:${minutes}`;
    }

    // Function to update the map with new coordinates
    function updateMap(lat, lon) {
        if (marker) {
            map.removeLayer(marker);
        }
        map.setView([lat, lon], 10);
        marker = L.marker([lat, lon]).addTo(map);
    }

    // Function to render the weekly weather forecast
    function renderWeather(data) {
        const weatherDays = document.querySelector('#week-weather');
        weatherDays.innerHTML = ''; 
    
        const dailyData = [];
        const usedDates = new Set();
    
        data.forEach(item => {
            const date = new Date(item.dt * 1000).toISOString().split('T')[0];
            if (!usedDates.has(date) && dailyData.length < 7) {
                usedDates.add(date);
                dailyData.push(item);
            }
        });
    
        dailyData.forEach((day, index) => {
            const weatherDay = document.createElement('div');
            weatherDay.classList.add('weather-day');
    
            const date = new Date(day.dt * 1000);
            const options = { weekday: 'short', day: 'numeric', month: 'short' };
            const formattedDate = date.toLocaleDateString('en-GB', options);
    
            const iconUrl = `http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
            const tempUnit = currentUnit === "metric" ? "°C" : "°F";
            const tempMax = currentUnit === "metric" ? Math.round(day.main.temp_max) : Math.round((day.main.temp_max * 9/5) + 32);
            const tempMin = currentUnit === "metric" ? Math.round(day.main.temp_min) : Math.round((day.main.temp_min * 9/5) + 32);
    
            weatherDay.innerHTML = `
                <h2>${formattedDate}</h2>
                <p class="date">${formattedDate}</p>
                <img class="weather-icon" src="${iconUrl}" alt="${day.weather[0].description}">
                <p class="temperature">+${tempMax}${tempUnit} / +${tempMin}${tempUnit}</p>
                <p class="description">${day.weather[0].description}</p>
            `;
    
            weatherDays.appendChild(weatherDay);
        });
    }

    // Function to render the monthly weather forecast
    function renderMonthlyWeather(data) {
        const weatherDays = document.querySelector('#month-weather');
        weatherDays.innerHTML = ''; 
    
        const dailyData = [];
        const usedDates = new Set();
        
        // Collect unique days from the data
        data.forEach(item => {
            const date = new Date(item.dt * 1000).toISOString().split('T')[0];
            if (!usedDates.has(date)) {
                usedDates.add(date);
                dailyData.push(item);
            }
        });
    
        const today = new Date();
        const oneMonthLater = new Date(today);
        oneMonthLater.setDate(today.getDate() + 30);
    
        // Filter data for the next month
        const filteredData = dailyData.filter(item => {
            const itemDate = new Date(item.dt * 1000);
            return itemDate >= today && itemDate <= oneMonthLater;
        });
    
        const weeklyData = [];
        for (let i = 0; i < filteredData.length; i += 7) {
            const chunk = filteredData.slice(i, i + 7);
            weeklyData.push(chunk);
        }
    
        weeklyData.forEach((week, index) => {
            if (week.length === 0) return;
    
            const weatherDay = document.createElement('div');
            weatherDay.classList.add('weather-day');
        
            const startDate = new Date(week[0].dt * 1000);
            const endDate = new Date(week[Math.min(week.length - 1, 6)].dt * 1000); // Handle the last partial week correctly
            const options = { day: 'numeric', month: 'short' };
            const formattedStartDate = startDate.toLocaleDateString('en-GB', options);
            const formattedEndDate = endDate.toLocaleDateString('en-GB', options);
        
            let totalTempMax = 0;
            let totalTempMin = 0;
            let descriptionCounts = {};
        
            week.forEach(day => {
                totalTempMax += day.main.temp_max;
                totalTempMin += day.main.temp_min;
                const description = day.weather[0].description;
                if (!descriptionCounts[description]) {
                    descriptionCounts[description] = 0;
                }
                descriptionCounts[description]++;
            });
        
            const avgTempMax = totalTempMax / week.length;
            const avgTempMin = totalTempMin / week.length;
            const tempMax = currentUnit === "metric" ? Math.round(avgTempMax) : Math.round((avgTempMax * 9/5) + 32);
            const tempMin = currentUnit === "metric" ? Math.round(avgTempMin) : Math.round((avgTempMin * 9/5) + 32);
            const tempUnit = currentUnit === "metric" ? "°C" : "°F"; // Determine unit
            const mostCommonDescription = Object.keys(descriptionCounts).reduce((a, b) => descriptionCounts[a] > descriptionCounts[b] ? a : b);
        
            const iconUrl = `http://openweathermap.org/img/wn/${week[Math.floor(week.length / 2)].weather[0].icon}@2x.png`; // Use the middle day's icon as a representative
        
            weatherDay.innerHTML = `
                <h2>${formattedStartDate} - ${formattedEndDate}</h2>
                <p class="date">${formattedStartDate} - ${formattedEndDate}</p>
                <img class="weather-icon" src="${iconUrl}" alt="${mostCommonDescription}">
                <p class="temperature">+${tempMax}${tempUnit} / +${tempMin}${tempUnit}</p>
                <p class="description">${mostCommonDescription}</p>
            `;
        
            weatherDays.appendChild(weatherDay);
        });
    }

    // Function to update the next week widget
    function updateNextWeekWidget(forecastData) {
        const nextWeekPredictions = document.getElementById("next-week-predictions");
        const nextWeekIcon = document.getElementById("next-week-icon");
    
        let totalTemp = 0;
        let totalWindSpeed = 0;
        const weatherConditions = {};
    
        const daysData = forecastData.slice(0, 7); // Take 7 days for the forecast
    
        daysData.forEach(day => {
            totalTemp += day.main.temp;
            totalWindSpeed += day.wind.speed;
            const condition = day.weather[0].main;
            if (weatherConditions[condition]) {
                weatherConditions[condition]++;
            } else {
                weatherConditions[condition] = 1;
            }
        });
    
        const averageTemp = totalTemp / daysData.length;
        const averageWindSpeed = totalWindSpeed / daysData.length;
        const tempUnit = currentUnit === "metric" ? "°C" : "°F";
        const avgTemp = currentUnit === "metric" ? Math.round(averageTemp) : Math.round((averageTemp * 9/5) + 32);
        const mostCommonCondition = Object.keys(weatherConditions).reduce((a, b) => weatherConditions[a] > weatherConditions[b] ? a : b);
    
        nextWeekPredictions.innerHTML = `
            Next week: ${mostCommonCondition} • +${avgTemp}${tempUnit} • wind ${averageWindSpeed.toFixed(1)} m/s
        `;
    
        const mostCommonConditionIcon = forecastData.find(day => day.weather[0].main === mostCommonCondition).weather[0].icon;
        nextWeekIcon.src = `http://openweathermap.org/img/wn/${mostCommonConditionIcon}.png`;
        nextWeekIcon.alt = mostCommonCondition;
    }

    // Function to update the tomorrow widget
    function updateTomorrowWidget(forecastData) {
        const tomorrowPredictions = document.getElementById("tomorrow-predictions");
        const tomorrowIcon = document.getElementById("tomorrow-icon");
    
        const tomorrowData = forecastData[1]; // Take forecast for tomorrow (second element in the array)
    
        const tempMin = currentUnit === "metric" ? Math.round(tomorrowData.main.temp_min) : Math.round((tomorrowData.main.temp_min * 9/5) + 32);
        const tempMax = currentUnit === "metric" ? Math.round(tomorrowData.main.temp_max) : Math.round((tomorrowData.main.temp_max * 9/5) + 32);
        const windSpeed = tomorrowData.wind.speed;
        const condition = tomorrowData.weather[0].main;
        const conditionIcon = tomorrowData.weather[0].icon;
        const tempUnit = currentUnit === "metric" ? "°C" : "°F"; // Determine unit
    
        tomorrowPredictions.innerHTML = `
            Tomorrow: ${condition} • +${tempMin}${tempUnit}..+${tempMax}${tempUnit} • wind ${windSpeed} m/s
        `;
    
        tomorrowIcon.src = `http://openweathermap.org/img/wn/${conditionIcon}.png`;
        tomorrowIcon.alt = condition;
    }
});
