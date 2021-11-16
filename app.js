const { MongoClient } = require("mongodb");
const axios = require("axios").default;

require("dotenv").config();

const client = new MongoClient(process.env.MONGODB_URL);
const dbName = "planes";

async function getFlightData() {
  const host = "https://data-live.flightradar24.com";
  const path =
    "/zones/fcgi/feed.js?faa=1&bounds=46.916%2C43.395%2C19.872%2C30.071&satellite=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=0&estimated=1&maxage=14400&gliders=1&airport=OTP,BBU&stats=1";
  const response = await axios.get(`${host}${path}`);
  return response.data;
}

function parseFlightData(flights) {
  const output = [];
  for (const flightId in flights) {
    if (Object.hasOwnProperty.call(flights, flightId)) {
      const flight = flights[flightId];
      if (Array.isArray(flight)) {
        output.push({
          flight_id: flightId,
          altitude: flight[4],
          track: flight[3],
          speed: flight[5],
          squawk: flight[6],
          planeType: flight[8],
        });
      }
    }
  }
  return output;
}

async function main() {
  // Use connect method to connect to the server
  await client.connect();
  console.log("Connected successfully to server");
  const db = client.db(dbName);
  const frFlights = await getFlightData();
  const dbFlights = parseFlightData(frFlights);
  const collection = db.collection("planes");

  const insertResult = await collection.insertMany(dbFlights);
  console.log("Inserted documents =>", insertResult);

  return "done.";
}

main()
  .then(console.log)
  .catch(console.error)
  .finally(() => client.close());
