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

    async function getWeatherData(city) {
        try {
            const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

            const weatherResponse = await fetch(apiUrl);
            if (!weatherResponse.ok) {
                throw new Error(`HTTP error: ${weatherResponse.status}`);
            }
            const weatherData = await weatherResponse.json();
            console.log('Weather data:', weatherData); // Отладочный лог
            updateWeatherCard(weatherData);
            updateTime(weatherData);
            updateMap(weatherData.coord.lat, weatherData.coord.lon); // Обновление карты с новыми координатами

            const forecastResponse = await fetch(forecastUrl);
            if (!forecastResponse.ok) {
                throw new Error(`HTTP error: ${forecastResponse.status}`);
            }
            const forecastData = await forecastResponse.json();
            console.log('Forecast data:', forecastData); // Отладочный лог
            updateForecast(forecastData);
            renderWeather(forecastData.list);
            renderMonthlyWeather(forecastData.list); // Добавляем вызов функции для месячного прогноза
            updateNextWeekWidget(forecastData.list); // Обновление виджета на следующую неделю
            updateTomorrowWidget(forecastData.list); // Обновление виджета на завтра
        } catch (error) {
            console.error("Error fetching the weather data:", error);
        }
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
    
            weatherDay.innerHTML = `
                <h2>${formattedDate}</h2>
                <p class="date">${formattedDate}</p>
                <img class="weather-icon" src="${iconUrl}" alt="${day.weather[0].description}">
                <p class="temperature">+${Math.round(day.main.temp_max)}° / +${Math.round(day.main.temp_min)}°</p>
                <p class="description">${day.weather[0].description}</p>
            `;
    
            weatherDays.appendChild(weatherDay);
        });
    }

    function renderMonthlyWeather(data) {
        const weatherDays = document.querySelector('#month-weather');
        weatherDays.innerHTML = ''; 
    
        const dailyData = [];
        const usedDates = new Set();
        
        // Собираем уникальные дни из данных
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
    
        // Фильтруем данные на месяц вперед
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
            const mostCommonDescription = Object.keys(descriptionCounts).reduce((a, b) => descriptionCounts[a] > descriptionCounts[b] ? a : b);
        
            const iconUrl = `http://openweathermap.org/img/wn/${week[Math.floor(week.length / 2)].weather[0].icon}@2x.png`; // Use the middle day's icon as a representative
        
            weatherDay.innerHTML = `
                <h2>${formattedStartDate} - ${formattedEndDate}</h2>
                <p class="date">${formattedStartDate} - ${formattedEndDate}</p>
                <img class="weather-icon" src="${iconUrl}" alt="${mostCommonDescription}">
                <p class="temperature">+${Math.round(avgTempMax)}° / +${Math.round(avgTempMin)}°</p>
                <p class="description">${mostCommonDescription}</p>
            `;
        
            weatherDays.appendChild(weatherDay);
        });
    }
    
    
    function updateNextWeekWidget(forecastData) {
        const nextWeekPredictions = document.getElementById("next-week-predictions");
        const nextWeekIcon = document.getElementById("next-week-icon");

        let totalTemp = 0;
        let totalWindSpeed = 0;
        const weatherConditions = {};

        const daysData = forecastData.slice(0, 7); // берем прогноз на 7 дней

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
        const mostCommonCondition = Object.keys(weatherConditions).reduce((a, b) => weatherConditions[a] > weatherConditions[b] ? a : b);

        nextWeekPredictions.innerHTML = `
            Next week: ${mostCommonCondition} • +${Math.round(averageTemp)}°C • wind ${averageWindSpeed.toFixed(1)} m/s
        `;

        const mostCommonConditionIcon = forecastData.find(day => day.weather[0].main === mostCommonCondition).weather[0].icon;
        nextWeekIcon.src = `http://openweathermap.org/img/wn/${mostCommonConditionIcon}.png`;
        nextWeekIcon.alt = mostCommonCondition;
    }

    function updateTomorrowWidget(forecastData) {
        const tomorrowPredictions = document.getElementById("tomorrow-predictions");
        const tomorrowIcon = document.getElementById("tomorrow-icon");

        const tomorrowData = forecastData[1]; // Берем прогноз на завтра (второй элемент массива)

        const tempMin = tomorrowData.main.temp_min;
        const tempMax = tomorrowData.main.temp_max;
        const windSpeed = tomorrowData.wind.speed;
        const condition = tomorrowData.weather[0].main;
        const conditionIcon = tomorrowData.weather[0].icon;

        tomorrowPredictions.innerHTML = `
            Tomorrow: ${condition} • +${tempMin}°..+${tempMax}° • wind ${windSpeed} m/s
        `;

        tomorrowIcon.src = `http://openweathermap.org/img/wn/${conditionIcon}.png`;
        tomorrowIcon.alt = condition;
    }
});
