const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server Is Running at http://localhost:3000`);
    });
  } catch (e) {
    console.log(`error ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//1 API GETTING ALL STATES

app.get("/states/", async (request, response) => {
  const allStateList = `
    SELECT * 
    FROM state
    `;
  const statesList = await db.all(allStateList);
  response.send(
    statesList.map((eachObject) => convertDbObjectToResponseObject(eachObject))
  );
});

//2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getState = `
        SELECT * 
        FROM state 
        WHERE 
            state_id = ${stateId}
    `;
  const newState = await db.get(getState);
  response.send(convertDbObjectToResponseObject(newState));
});

//3

app.post("/districts/", async (request, response) => {
  const createDistrict = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = createDistrict;
  const newDistrict = `
    INSERT INTO 
    district (district_name, state_id, cases,cured, active, deaths)
    VALUES
        ('${districtName}',
          ${stateId},
          ${cases},
          ${cured},
          ${active},
          ${deaths}
        );`;
  const addDistrict = await db.run(newDistrict);
  const districtId = addDistrict.lastId;
  response.send("District Successfully Added");
});
//4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `
        SELECT * 
        FROM district 
        WHERE district_id = ${districtId};`;
  const newDistrict = await db.get(getDistrict);

  response.send(convertDbObjectToResponseObject(newDistrict));
});

//5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = ` 
    DELETE 
    FROM district WHERE district_id = ${districtId}
    `;
  await db.run(deleteDistrict);
  response.send("District Removed");
});

//6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const UpdateQuery = `
            UPDATE district SET
                district_name = '${districtName}',
                state_id = ${stateId},
                cases = ${cases},
                cured = ${cured},
                active = ${active},
                deaths = ${deaths}
            WHERE district_id = ${districtId};`;
  await db.run(UpdateQuery);

  response.send("District Details Updated");
});

//7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesReport = `
        SELECT 
            SUM(cases),
            SUM(cured) ,
            SUM(active) ,
            SUM(deaths) 
        FROM district
        WHERE 
            state_id = ${stateId}`;

  const stats = await db.get(getStateReport);

  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateDetails = `
    SELECT state_name
    FROM 
    NATURAL JOIN district 
    WHERE district_id = ${districtId}
  `;
  const stateName = await db.get(stateDetails);
  response.send(convertDbObjectToResponseObject));
});

module.exports = app;
