
// ======================================
// 1. API CONFIGURATION
// ======================================

const API_KEY = "30620c782ef720e8d2f28d9ba244f44b";

const BASE_URL = "https://api.openweathermap.org/data/2.5";

// ======================================
// 2. GET HTML ELEMENTS
// ======================================

const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const locationBtn = document.getElementById("locationBtn");
const unitToggle = document.getElementById("unitToggle");

const weatherContent = document.getElementById("weatherContent");
const loader = document.getElementById("loader");
const message = document.getElementById("message");

const cityName = document.getElementById("cityName");
const weatherDescription = document.getElementById("weatherDescription");
const weatherIcon = document.getElementById("weatherIcon");
const temperature = document.getElementById("temperature");
const feelsLike = document.getElementById("feelsLike");
const minMax = document.getElementById("minMax");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const pressure = document.getElementById("pressure");
const cloudiness = document.getElementById("cloudiness");

const forecastContainer = document.getElementById("forecastContainer");
const historyContainer = document.getElementById("historyContainer");
const dateTime = document.getElementById("dateTime");

// ======================================
// 3. APP VARIABLES
// ======================================

let isCelsius = true;
let currentWeather = null;
let recentCities = JSON.parse(
    localStorage.getItem("recentCities") || "[]"
);

// ======================================
// 4. DATE AND TIME
// ======================================

function updateDateTime() {
    dateTime.textContent = new Date().toLocaleString(
        "en-IN",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

updateDateTime();
setInterval(updateDateTime, 60000);

// ======================================
// 5. LOADING AND ERROR HANDLING
// ======================================

function showLoading(show) {
    loader.classList.toggle("hidden", !show);
}

function showMessage(text) {
    message.textContent = text;
}

// ======================================
// 6. FETCH CURRENT WEATHER
// ======================================

async function getWeather(city) {
    if (API_KEY === "YOUR_OPENWEATHER_API_KEY") {
        showMessage("Please add your OpenWeather API key in script.js.");
        return;
    }

    showLoading(true);
    showMessage("");

    try {
        const url =
            `${BASE_URL}/weather?q=${encodeURIComponent(city)}` +
            `&appid=${API_KEY}&units=metric`;

        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("City not found. Please enter a valid city.");
            }

            if (response.status === 401) {
                throw new Error("Invalid API key or API access not activated.");
            }

            throw new Error("Unable to fetch weather. Please try again.");
        }

        const data = await response.json();

        currentWeather = data;

        displayWeather(data);
        addToHistory(data.name);

        await getForecast(data.coord.lat, data.coord.lon);

        weatherContent.classList.remove("hidden");

    } catch (error) {
        weatherContent.classList.add("hidden");
        forecastContainer.innerHTML = "";
        showMessage(error.message);
    } finally {
        showLoading(false);
    }
}

// ======================================
// 7. DISPLAY CURRENT WEATHER
// ======================================

function convertTemperature(celsius) {
    return isCelsius
        ? celsius
        : (celsius * 9 / 5) + 32;
}

function displayWeather(data) {
    const weather = data.weather[0];
    const unit = isCelsius ? "°C" : "°F";

    cityName.textContent = `${data.name}, ${data.sys.country}`;

    weatherDescription.textContent =
        weather.description.charAt(0).toUpperCase() +
        weather.description.slice(1);

    weatherIcon.src =
        `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;

    weatherIcon.alt = weather.description;

    temperature.textContent =
        `${Math.round(convertTemperature(data.main.temp))}${unit}`;

    feelsLike.textContent =
        `${Math.round(convertTemperature(data.main.feels_like))}${unit}`;

    minMax.textContent =
        `H: ${Math.round(convertTemperature(data.main.temp_max))}${unit}  ` +
        `L: ${Math.round(convertTemperature(data.main.temp_min))}${unit}`;

    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${data.wind.speed} m/s`;
    pressure.textContent = `${data.main.pressure} hPa`;
    cloudiness.textContent = `${data.clouds.all}%`;
}

// ======================================
// 8. FETCH 5-DAY FORECAST
// ======================================

async function getForecast(lat, lon) {
    const url =
        `${BASE_URL}/forecast?lat=${lat}&lon=${lon}` +
        `&appid=${API_KEY}&units=metric`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to load the 5-day forecast.");
    }

    const data = await response.json();

    displayForecast(data.list);
}

// ======================================
// 9. DISPLAY FORECAST
// ======================================

function displayForecast(forecastList) {
    forecastContainer.innerHTML = "";

    const dailyData = {};

    // Group forecast entries by date
    forecastList.forEach(item => {
        const date = item.dt_txt.split(" ")[0];

        if (!dailyData[date]) {
            dailyData[date] = [];
        }

        dailyData[date].push(item);
    });

    // Get the next five forecast days
    const days = Object.values(dailyData).slice(1, 6);

    days.forEach(day => {
        const minTemp = Math.min(
            ...day.map(item => item.main.temp_min)
        );

        const maxTemp = Math.max(
            ...day.map(item => item.main.temp_max)
        );

        // Use the forecast closest to noon
        const midday = day.reduce((best, item) => {
            const hour = Number(item.dt_txt.split(" ")[1].slice(0, 2));

            const bestHour = Number(
                best.dt_txt.split(" ")[1].slice(0, 2)
            );

            return Math.abs(hour - 12) < Math.abs(bestHour - 12)
                ? item
                : best;
        }, day[0]);

        const date = new Date(`${midday.dt_txt.replace(" ", "T")}Z`);

        const dayName = date.toLocaleDateString("en-IN", {
            weekday: "short"
        });

        const icon = midday.weather[0].icon;
        const description = midday.weather[0].description;
        const unit = isCelsius ? "°C" : "°F";

        const card = document.createElement("div");
        card.className = "forecast-card";

        const dayText = document.createElement("p");
        dayText.textContent = dayName;

        const iconImage = document.createElement("img");
        iconImage.src =
            `https://openweathermap.org/img/wn/${icon}@2x.png`;
        iconImage.alt = description;

        const condition = document.createElement("p");
        condition.textContent = description;

        const highLow = document.createElement("h3");
        highLow.textContent =
            `${Math.round(convertTemperature(maxTemp))}${unit} / ` +
            `${Math.round(convertTemperature(minTemp))}${unit}`;

        card.append(dayText, iconImage, condition, highLow);
        forecastContainer.appendChild(card);
    });
}

// ======================================
// 10. CITY SEARCH
// ======================================

searchForm.addEventListener("submit", event => {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        showMessage("Please enter a city name.");
        return;
    }

    getWeather(city);
    cityInput.value = "";
});

// ======================================
// 11. CURRENT LOCATION
// ======================================

locationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
        showMessage("Geolocation is not supported by your browser.");
        return;
    }

    if (API_KEY === "YOUR_OPENWEATHER_API_KEY") {
        showMessage("Please configure your OpenWeather API key first.");
        return;
    }

    showLoading(true);
    showMessage("");

    navigator.geolocation.getCurrentPosition(
        async position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {
                const url =
                    `${BASE_URL}/weather?lat=${lat}&lon=${lon}` +
                    `&appid=${API_KEY}&units=metric`;

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error("Unable to get your local weather.");
                }

                const data = await response.json();

                currentWeather = data;

                displayWeather(data);
                addToHistory(data.name);

                await getForecast(lat, lon);

                weatherContent.classList.remove("hidden");

            } catch (error) {
                showMessage(error.message);
                weatherContent.classList.add("hidden");
            } finally {
                showLoading(false);
            }
        },

        error => {
            showLoading(false);

            const errors = {
                1: "Location permission denied. Please allow location access.",
                2: "Your location is currently unavailable.",
                3: "Location request timed out."
            };

            showMessage(errors[error.code] || "Unable to detect your location.");
        },

        { timeout: 10000 }
    );
});

// ======================================
// 12. CELSIUS / FAHRENHEIT
// ======================================

unitToggle.addEventListener("click", () => {
    isCelsius = !isCelsius;

    unitToggle.textContent = isCelsius
        ? "Switch to °F"
        : "Switch to °C";

    if (currentWeather) {
        displayWeather(currentWeather);

        // Re-render the forecast using the selected unit.
        getForecast(
            currentWeather.coord.lat,
            currentWeather.coord.lon
        ).catch(error => showMessage(error.message));
    }
});

// ======================================
// 13. RECENT SEARCH HISTORY
// ======================================

function addToHistory(city) {
    recentCities = [
        city,
        ...recentCities.filter(
            item => item.toLowerCase() !== city.toLowerCase()
        )
    ].slice(0, 5);

    localStorage.setItem(
        "recentCities",
        JSON.stringify(recentCities)
    );

    displayHistory();
}

function displayHistory() {
    historyContainer.innerHTML = "";

    recentCities.forEach(city => {
        const button = document.createElement("button");

        button.className = "history-item";
        button.textContent = city;

        button.addEventListener("click", () => {
            getWeather(city);
        });

        historyContainer.appendChild(button);
    });
}

// Show previously saved searches
displayHistory();
