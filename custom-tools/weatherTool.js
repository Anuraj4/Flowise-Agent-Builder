/*
 * Custom Tool Example for Flowise
 * 
 * In Flowise, Custom Tools allow you to extend your AI agents with standard JavaScript/TypeScript code.
 * You can define input variables, execute HTTP fetches, format data, and return string results back to the agent.
 */

// Example: Simple Weather Fetcher Tool
const fetch = require('node-fetch');

async function getWeather(location) {
    try {
        const response = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
        if (!response.ok) {
            return `Could not fetch weather for ${location}. Status: ${response.status}`;
        }
        const data = await response.json();
        const currentCondition = data.current_condition[0];
        const tempC = currentCondition.temp_C;
        const tempF = currentCondition.temp_F;
        const weatherDesc = currentCondition.weatherDesc[0].value;
        const humidity = currentCondition.humidity;

        return `Current weather in ${location}: ${weatherDesc}, Temp: ${tempC}°C (${tempF}°F), Humidity: ${humidity}%.`;
    } catch (error) {
        return `Error executing weather lookup for ${location}: ${error.message}`;
    }
}

// Code snippet to paste into Flowise Custom Tool canvas node:
/*
const fetch = require('node-fetch');
const url = `https://wttr.in/${encodeURIComponent($location)}?format=j1`;
const response = await fetch(url);
const data = await response.json();
return `Weather in ${$location}: ${data.current_condition[0].weatherDesc[0].value}, ${data.current_condition[0].temp_C}°C`;
*/

module.exports = { getWeather };
