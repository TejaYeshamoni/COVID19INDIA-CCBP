const express = require("express");
const app = express();
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const objectSnaketoCamel = (newObject) => {
  return {
    stateId: newObject.state_id,
    stateName: newObject.state_name,
    population: newObject.population,
  };
};

const districtSnakeToCamel = (newObject) => {
  return {
    districtId: newObject.districtId,
    districtName: newObject.district_name,
    stateId: newObject.state_id,
    cases: newObject.cases,
    cured: newObject.cured,
    active: newObject.active,
    deaths: newObject.deaths,
  };
};

const reportSnakeToCamelCase = (newObject) => {
  return {
    totalCases: newObject.total_cases,
    totalCured: newObject.total_cured,
    totalActive: newObject.total_active,
    totalDeaths: newObject.total_deaths,
  };
};

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

//1

app.get("/states/", async (request, response) => {
  const allStateList = `
    SELECT * 
    FROM state
    ORDER BY state_id;
    `;
  const statesList = await db.all(allStateList);
  const statesResult = statesList.map((eachObject) => {
    return objectSnaketoCamel(eachObject);
  });
  response.send(statesResult);
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
  const stateResult = objectSnaketoCamel(newState);
  response.send(stateResult);
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

app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `
        SELECT * 
        FROM district 
        WHERE district_id = ${districtId};`;
  const newDistrict = await db.get(getDistrict);
  const districtResult = districtSnakeToCamel(newDistrict);
  response.send(districtResult);
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
  const updateDistrict = `
    UPDATE 
        district
    SET
        district_name = ${districtName},
        stateId = ${stateId},
        cases = ${cases},
        active = ${active},
        deaths = ${deaths}
    WHERE district_id = ${districtId}  
  `;
  await db.run(updateDistrict);
  response.send("District Details Updated");
});

//7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateReport = `
        SELECT SUM(cases) AS cases,
            SUM(cured) AS cured,
            SUM(active) AS active,
            SUM(deaths) AS deaths
        FROM district
        WHERE state_id = ${stateId}`;
  const stateReport = await db.get(getStateReport);
  const resultReport = reportSnakeToCamelCase(stateReport);
  response.send(resultReport);
});

//8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateDetails = `
    SELECT state_name
    FROM state JOIN district 
         ON state.stateId = district.state_id
    WHERE district.district_id = ${districtId}
  `;
  const stateName = await db.get(stateDetails);
  response.send({ stateName: stateName.state_name });
});

module.exports = app;
